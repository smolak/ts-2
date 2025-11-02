import { db, orm, schema } from "@repo/db/db";
import type { UserId } from "@repo/db/id/user-id";
import type { Url, UserUrl } from "@repo/db/types";

import { createCompoundHash, createUrlHash } from "./compound-hash";
import type { AddUrlRequestBody } from "./request-body.schema";

interface Params {
  tagIds: AddUrlRequestBody["tagIds"];
  metadata: AddUrlRequestBody["metadata"];
  userId: UserId;
}

type AddUrl = (params: Params) => Promise<UserUrl>;

export const addUrl: AddUrl = async ({ tagIds, metadata, userId }) => {
  const compoundHash = createCompoundHash(metadata);
  const urlHash = createUrlHash(metadata.url);

  const maybeUrl = await db.query.urls.findFirst({
    where: (urls, { eq }) => eq(urls.compoundHash, compoundHash),
  });
  const maybeUrlHashesCompoundHashesCountEntry = await db.query.urlHashesCompoundHashesCounts.findFirst({
    where: (urlHashesCompoundHashesCounts, { eq }) => eq(urlHashesCompoundHashesCounts.urlHash, urlHash),
  });

  const followers = await db.query.follows.findMany({
    where: (follows, { eq }) => eq(follows.followingId, userId),
    columns: {
      followerId: true,
    },
    orderBy: (follows, { asc }) => [asc(follows.createdAt)],
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

      await tx
        .update(schema.tags)
        .set({
          urlsCount: orm.sql`${schema.tags.urlsCount} + 1`,
        })
        .where(orm.inArray(schema.tags.id, tagIds));
    }

    await tx
      .update(schema.userProfiles)
      .set({ urlsCount: orm.sql`${schema.userProfiles.urlsCount} + 1` })
      .where(orm.eq(schema.userProfiles.userId, userId));

    const feedData = [
      {
        userId,
        userUrlId: userUrl.id,
      },
    ];

    if (followers.length > 0) {
      const followersData = followers.map((follower) => ({
        userId: follower.followerId,
        userUrlId: userUrl.id,
      }));

      feedData.push(...followersData);
    }

    await tx.insert(schema.feeds).values(feedData);

    return userUrl;
  });

  return result;
};
