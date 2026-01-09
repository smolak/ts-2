import { deckIdSchema } from "@repo/db/id/deck-id";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDeckTags as getDeckTagsFn } from "@/features/tag/services";
import { protectedProcedure } from "@/server/api/trpc";

type GetMyDeckTagsResult = TagDto[];

const getMyDeckTagsSchema = z.object({
  deckId: deckIdSchema,
});

/**
 * Fetches tags from a deck owned by the authenticated user.
 * Requires authentication and verifies deck ownership.
 */
export const getMyDeckTags = protectedProcedure
  .input(getMyDeckTagsSchema)
  .query<GetMyDeckTagsResult>(async ({ input: { deckId }, ctx: { logger, requestId, db, userId } }) => {
    const path = "tags.getMyDeckTags";

    logger.info({ requestId, path, deckId }, "Fetching deck's tags.");

    try {
      const { tags } = await getDeckTagsFn({ db, userId, deckId });

      logger.info({ requestId, path, deckId, count: tags.length }, "Deck's tags fetched.");

      return tags;
    } catch (error) {
      if (error instanceof Error && error.message === "Deck not found.") {
        logger.error({ requestId, path, deckId }, "Deck not found or not owned by user.");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deck not found.",
        });
      }
      throw error;
    }
  });
