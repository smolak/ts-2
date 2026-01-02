import { db, orm, schema } from "@repo/db/db";
import type { UserId } from "@repo/db/id/user-id";
import type { Url, UserUrl } from "@repo/db/types";

import { createCompoundHash, createUrlHash } from "./compound-hash";
import type { AddUrlRequestBody } from "./request-body.schema";

interface Params {
  deckId: AddUrlRequestBody["deckId"];
  tagIds: AddUrlRequestBody["tagIds"];
  metadata: AddUrlRequestBody["metadata"];
  userId: UserId;
}

type AddUrl = (params: Params) => Promise<UserUrl>;

export const addUrl: AddUrl = async ({ deckId, tagIds, metadata, userId }) => {
  const compoundHash = createCompoundHash(metadata);
  const urlHash = createUrlHash(metadata.url);

  // Run deck validation and maybeUrl check in parallel
  const [deck, maybeUrl] = await Promise.all([
    db.query.decks.findFirst({
      where: (decks, { and, eq, isNull }) =>
        and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
      columns: { id: true, isPublic: true },
    }),
    db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.compoundHash, compoundHash),
      columns: { id: true },
    }),
  ]);

  // Fail fast if deck doesn't exist
  if (!deck) {
    throw new Error("Deck not found or not owned by user.");
  }

  // Only fetch this if we need it (when maybeUrl doesn't exist)
  const maybeUrlHashesCompoundHashesCountEntry = maybeUrl
    ? null
    : await db.query.urlHashesCompoundHashesCounts.findFirst({
        where: (urlHashesCompoundHashesCounts, { eq }) => eq(urlHashesCompoundHashesCounts.urlHash, urlHash),
        columns: { urlHash: true },
      });

  const result = await db.transaction(async (tx) => {
    let urlId: Url["id"];

    if (maybeUrl) {
      urlId = maybeUrl.id;

      // URL deduplication tracking:
      // This tracks how many times each URL+metadata combination (compoundHash) is saved,
      // and how many different metadata variations exist for the same URL (urlHash).
      // This enables detection of:
      // - Stale metadata (page title/description changed since first save)
      // - Potentially spoofed metadata (manipulated data from untrusted sources)
      // - Usage patterns for future cleanup of duplicate URL entries
      await tx
        .update(schema.urlHashes)
        .set({
          count: orm.sql`${schema.urlHashes.count} + 1`,
        })
        .where(orm.eq(schema.urlHashes.compoundHash, compoundHash));
    } else {
      const [url] = await tx
        .insert(schema.urls)
        .values({
          compoundHash,
          metadata,
          url: metadata.url,
        })
        .returning();

      if (!url) {
        throw new Error("Failed to create URL entry.");
      }

      urlId = url.id;

      // URL deduplication tracking:
      // This tracks how many times each URL+metadata combination (compoundHash) is saved,
      // and how many different metadata variations exist for the same URL (urlHash).
      // This enables detection of:
      // - Stale metadata (page title/description changed since first save)
      // - Potentially spoofed metadata (manipulated data from untrusted sources)
      // - Usage patterns for future cleanup of duplicate URL entries
      await tx.insert(schema.urlHashes).values({ compoundHash, urlHash, count: 1 });

      if (maybeUrlHashesCompoundHashesCountEntry) {
        await tx
          .update(schema.urlHashesCompoundHashesCounts)
          .set({
            compoundHashesCount: orm.sql`${schema.urlHashesCompoundHashesCounts.compoundHashesCount} + 1`,
          })
          .where(orm.eq(schema.urlHashesCompoundHashesCounts.urlHash, urlHash));
      } else {
        await tx.insert(schema.urlHashesCompoundHashesCounts).values({ urlHash, compoundHashesCount: 1 });
      }
    }

    const [userUrl] = await tx.insert(schema.usersUrls).values({ userId, urlId }).returning();

    if (!userUrl) {
      throw new Error("Failed to create userUrl entry.");
    }

    await tx.insert(schema.deckUrls).values({ deckId, userUrlId: userUrl.id });

    await tx
      .update(schema.decks)
      .set({ urlsCount: orm.sql`${schema.decks.urlsCount} + 1` })
      .where(orm.eq(schema.decks.id, deckId));

    if (tagIds.length > 0) {
      const deckTags = await tx.query.tags.findMany({
        where: (tags, { and, eq, inArray }) => and(eq(tags.deckId, deckId), inArray(tags.id, tagIds)),
        columns: { id: true },
      });

      const validTagIds = deckTags.map((t) => t.id);

      if (validTagIds.length > 0) {
        await tx.insert(schema.deckUrlsTags).values(
          validTagIds.map((tagId, index) => ({
            deckId,
            userUrlId: userUrl.id,
            tagId,
            tagOrder: index + 1,
          })),
        );

        await tx
          .update(schema.tags)
          .set({ urlsCount: orm.sql`${schema.tags.urlsCount} + 1` })
          .where(orm.inArray(schema.tags.id, validTagIds));
      }
    }

    await tx.insert(schema.feeds).values({
      userId,
      userUrlId: userUrl.id,
      deckId,
    });

    if (deck.isPublic) {
      const followers = await tx.query.deckFollows.findMany({
        where: (follows, { eq }) => eq(follows.deckId, deckId),
        columns: { followerId: true },
      });

      if (followers.length > 0) {
        await tx.insert(schema.feeds).values(
          followers.map((follower) => ({
            userId: follower.followerId,
            userUrlId: userUrl.id,
            deckId,
          })),
        );
      }
    }

    await tx
      .update(schema.userProfiles)
      .set({ urlsCount: orm.sql`${schema.userProfiles.urlsCount} + 1` })
      .where(orm.eq(schema.userProfiles.userId, userId));

    return userUrl;
  });

  return result;
};
