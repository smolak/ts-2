import { deckIdSchema } from "@repo/db/id/deck-id";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "@/server/api/trpc";

type GetPublicDeckTagsResult = TagDto[];

const getPublicDeckTagsSchema = z.object({
  deckId: deckIdSchema,
});

/**
 * Public procedure for fetching tags from a PUBLIC deck.
 * Can be accessed by anonymous users.
 * Only returns tags if the deck is public.
 */
export const getPublicDeckTags = publicProcedure
  .input(getPublicDeckTagsSchema)
  .query<GetPublicDeckTagsResult>(async ({ input: { deckId }, ctx: { logger, requestId, db } }) => {
    const path = "tags.getPublicDeckTags";

    logger.info({ requestId, path, deckId }, "Fetching public deck's tags.");

    try {
      // Verify deck exists and is public, then fetch tags in parallel
      const [deck, tags] = await Promise.all([
        db.query.decks.findFirst({
          where: (decks, { and, eq, isNull }) =>
            and(eq(decks.id, deckId), eq(decks.isPublic, true), isNull(decks.scheduledForDeletionAt)),
          columns: { id: true },
        }),
        db.query.tags.findMany({
          columns: {
            id: true,
            name: true,
            displayName: true,
            urlsCount: true,
          },
          where: (tags, { eq }) => eq(tags.deckId, deckId),
          orderBy: (tags, { asc }) => [asc(tags.name)],
        }),
      ]);

      if (!deck) {
        logger.error({ requestId, path, deckId }, "Public deck not found.");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deck not found.",
        });
      }

      logger.info({ requestId, path, deckId, count: tags.length }, "Public deck's tags fetched.");

      return tags;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logger.error({ requestId, path, deckId, error }, "Failed to fetch public deck tags.");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch deck tags.",
        cause: error,
      });
    }
  });
