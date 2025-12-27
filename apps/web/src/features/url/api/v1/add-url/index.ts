import { db, orm, schema } from "@repo/db/db";
import type { UserId } from "@repo/db/id/user-id";
import type { Url, UserUrl } from "@repo/db/types";

import { createCompoundHash, createUrlHash } from "./compound-hash";
import type { AddUrlRequestBody } from "./request-body.schema";

interface Params {
  tagIds: AddUrlRequestBody["tagIds"];
  deckIds: AddUrlRequestBody["deckIds"];
  metadata: AddUrlRequestBody["metadata"];
  userId: UserId;
}

type AddUrl = (params: Params) => Promise<UserUrl>;

export const addUrl: AddUrl = async ({ tagIds, deckIds, metadata, userId }) => {
  const compoundHash = createCompoundHash(metadata);
  const urlHash = createUrlHash(metadata.url);

  const maybeUrl = await db.query.urls.findFirst({
    where: (urls, { eq }) => eq(urls.compoundHash, compoundHash),
  });
  const maybeUrlHashesCompoundHashesCountEntry = await db.query.urlHashesCompoundHashesCounts.findFirst({
    where: (urlHashesCompoundHashesCounts, { eq }) => eq(urlHashesCompoundHashesCounts.urlHash, urlHash),
  });

  const result = await db.transaction(async (tx) => {
    let urlId: Url["id"];

    if (maybeUrl) {
      urlId = maybeUrl.id;

      // Stuff related to "in case some bogus data is sent as metadata" or "metadata changed on the page"
      // BEGINNING
      await tx
        .update(schema.urlHashes)
        .set({
          count: orm.sql`${schema.urlHashes.count} + 1`,
        })
        .where(orm.eq(schema.urlHashes.compoundHash, compoundHash));
      // END
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

      // Stuff related to "in case some bogus data is sent as metadata" or "metadata changed on the page"
      // BEGINNING
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
      // END
    }

    const [userUrl] = await tx.insert(schema.usersUrls).values({ userId, urlId }).returning();

    if (!userUrl) {
      throw new Error("Failed to create userUrl entry.");
    }

    if (tagIds.length > 0) {
      const dataToAdd = tagIds.map((tagId, index) => ({
        tagId,
        userUrlId: userUrl.id,
        tagOrder: index + 1,
      }));

      await tx.insert(schema.userUrlsTags).values(dataToAdd);

      // Increment urlsCount only for user's own tags
      await tx
        .update(schema.tags)
        .set({
          urlsCount: orm.sql`${schema.tags.urlsCount} + 1`,
        })
        .where(orm.and(orm.inArray(schema.tags.id, tagIds), orm.eq(schema.tags.userId, userId)));
    }

    // Handle deck associations
    if (deckIds.length > 0) {
      // Verify all decks belong to the user and are not pending deletion
      const userDecks = await tx.query.decks.findMany({
        where: (decks, { and, eq, inArray, isNull }) =>
          and(eq(decks.userId, userId), inArray(decks.id, deckIds), isNull(decks.scheduledForDeletionAt)),
        columns: { id: true, isPublic: true },
      });

      const validDeckIds = userDecks.map((d) => d.id);

      if (validDeckIds.length > 0) {
        // Add URL to decks
        await tx.insert(schema.deckUrls).values(validDeckIds.map((deckId) => ({ deckId, userUrlId: userUrl.id })));

        // Increment urlsCount for each deck
        await tx
          .update(schema.decks)
          .set({
            urlsCount: orm.sql`${schema.decks.urlsCount} + 1`,
          })
          .where(orm.inArray(schema.decks.id, validDeckIds));

        // Fan-out to followers of public decks
        const publicDeckIds = userDecks.filter((d) => d.isPublic).map((d) => d.id);

        if (publicDeckIds.length > 0) {
          const deckFollowers = await tx.query.deckFollows.findMany({
            where: (follows, { inArray }) => inArray(follows.deckId, publicDeckIds),
            columns: { deckId: true, followerId: true },
          });

          if (deckFollowers.length > 0) {
            await tx.insert(schema.feeds).values(
              deckFollowers.map((follower) => ({
                userId: follower.followerId,
                userUrlId: userUrl.id,
                deckId: follower.deckId,
              })),
            );
          }
        }
      }
    }

    await tx
      .update(schema.userProfiles)
      .set({ urlsCount: orm.sql`${schema.userProfiles.urlsCount} + 1` })
      .where(orm.eq(schema.userProfiles.userId, userId));

    // Add URL to owner's own feed (they always see their own URLs)
    await tx.insert(schema.feeds).values({
      userId,
      userUrlId: userUrl.id,
    });

    return userUrl;
  });

  return result;
};
