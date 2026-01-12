import { db, orm, schema } from "@repo/db/db";
import { deckIdSchema } from "@repo/db/id/deck-id";
import { type UserId, userIdSchema } from "@repo/db/id/user-id";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "@/server/api/trpc";

import { type FeedDto, toFeedDto } from "../../dto/feed.dto";
import { getPublicUserFeedQuery } from "../../queries/get-public-user-feed";
import { feedSourceSchema } from "../../shared/feed-source";

type QuerySchema = z.infer<typeof querySchema>;

const querySchema = z.object({
  cursor: z.date().optional(),
  userId: userIdSchema,
  feedSource: feedSourceSchema,
  deckId: deckIdSchema.optional(),
});

export type GetPublicFeedResponse = {
  feed: ReadonlyArray<FeedDto>;
  nextCursor?: QuerySchema["cursor"];
};

const itemsPerFetch = 10;

/**
 * Public procedure for fetching a user's public feed.
 * Only returns feed entries from PUBLIC decks (isPublic = true).
 * Can be accessed by anonymous users and non-owners.
 * If the viewer is logged in, they will see their "liked" status on items.
 */
export const getPublicFeed = publicProcedure
  .input(querySchema)
  .query<GetPublicFeedResponse>(async ({ ctx: { logger, requestId, auth }, input }) => {
    const path = "feeds.getPublicFeed";

    try {
      logger.info({ requestId, path }, "Fetching user's public feed list.");

      // Get viewerId if the user is authenticated (for "liked" status)
      let viewerId: UserId | undefined;

      if (auth.userId) {
        const [user] = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(orm.eq(schema.users.clerkUserId, auth.userId))
          .limit(1);

        viewerId = user?.id;
      }

      const feedRawEntries = await getPublicUserFeedQuery({
        userId: input.userId,
        viewerId,
        limit: itemsPerFetch,
        cursor: input.cursor,
        feedSource: input.feedSource,
        deckId: input.deckId,
      });

      const feed = feedRawEntries.map((entry) => toFeedDto(entry));

      logger.info({ requestId, path, userId: input.userId }, "User's public feed list fetched.");

      let nextCursor: QuerySchema["cursor"];

      if (feedRawEntries.length === itemsPerFetch && feedRawEntries.length > 0) {
        nextCursor = feedRawEntries[feedRawEntries.length - 1]?.feed_createdAt;
      }

      return {
        feed,
        nextCursor,
      };
    } catch (error) {
      logger.error({ requestId, path, error }, "Failed to fetch user's public feed list.");

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user's public feed list.",
        cause: error,
      });
    }
  });
