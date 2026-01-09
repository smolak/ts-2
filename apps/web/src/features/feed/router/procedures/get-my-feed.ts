import { deckIdSchema } from "@repo/db/id/deck-id";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

import { type FeedDto, toFeedDto } from "../../dto/feed.dto";
import { getMyFeedQuery } from "../../queries/get-my-feed";
import { feedSourceSchema } from "../../shared/feed-source";

type QuerySchema = z.infer<typeof querySchema>;

const querySchema = z.object({
  cursor: z.date().optional(),
  feedSource: feedSourceSchema,
  deckId: deckIdSchema.optional(),
});

export type GetMyFeedResponse = {
  feed: ReadonlyArray<FeedDto>;
  nextCursor?: QuerySchema["cursor"];
};

const itemsPerFetch = 10;

/**
 * Protected procedure for fetching the authenticated user's own feed.
 * Shows ALL feed entries including private decks.
 * Uses ctx.userId directly - only the authenticated user can view their own feed.
 */
export const getMyFeed = protectedProcedure
  .input(querySchema)
  .query<GetMyFeedResponse>(async ({ ctx: { logger, requestId, userId }, input }) => {
    const path = "feeds.getMyFeed";

    try {
      logger.info({ requestId, path }, "Fetching user's feed list.");

      const feedRawEntries = await getMyFeedQuery({
        ownerId: userId,
        limit: itemsPerFetch,
        cursor: input.cursor,
        feedSource: input.feedSource,
        deckId: input.deckId,
      });

      const feed = feedRawEntries.map((entry) => toFeedDto(entry));

      logger.info({ requestId, path, userId }, "User's feed list fetched.");

      let nextCursor: QuerySchema["cursor"];

      if (feedRawEntries.length === itemsPerFetch && feedRawEntries.length > 0) {
        nextCursor = feedRawEntries[feedRawEntries.length - 1]?.feed_createdAt;
      }

      return {
        feed,
        nextCursor,
      };
    } catch (error) {
      logger.error({ requestId, path, error }, "Failed to fetch user's feed list.");

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user's feed list.",
        cause: error,
      });
    }
  });
