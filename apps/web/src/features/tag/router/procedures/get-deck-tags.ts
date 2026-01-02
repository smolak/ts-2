import { deckIdSchema } from "@repo/db/id/deck-id";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

type GetDeckTagsResult = TagDto[];

const getDeckTagsSchema = z.object({
  deckId: deckIdSchema,
});

export const getDeckTags = protectedProcedure
  .input(getDeckTagsSchema)
  .query<GetDeckTagsResult>(async ({ input: { deckId }, ctx: { logger, requestId, db, userId } }) => {
    const path = "tag.getDeckTags";

    logger.info({ requestId, path, deckId }, "Fetching deck's tags.");

    // Verify deck ownership and fetch tags in parallel
    const [deck, tags] = await Promise.all([
      db.query.decks.findFirst({
        where: (decks, { and, eq, isNull }) =>
          and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
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
      logger.error({ requestId, path, deckId }, "Deck not found or not owned by user.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    logger.info({ requestId, path, deckId, count: tags.length }, "Deck's tags fetched.");

    return tags;
  });
