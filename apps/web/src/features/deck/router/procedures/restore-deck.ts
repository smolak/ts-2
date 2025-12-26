import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { restoreDeckSchema } from "../../schemas/restore-deck.schema";

type RestoreDeckResult = {
  restored: true;
};

export const restoreDeck = protectedProcedure
  .input(restoreDeckSchema)
  .mutation<RestoreDeckResult>(async ({ input: { deckId }, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.restoreDeck";

    // 1. Verify deck exists, belongs to user, and is pending deletion
    const existingDeck = await db.query.decks.findFirst({
      where: (decks, { and, eq, isNotNull }) =>
        and(eq(decks.id, deckId), eq(decks.userId, userId), isNotNull(decks.scheduledForDeletionAt)),
      columns: { id: true, scheduledForDeletionAt: true },
    });

    if (!existingDeck) {
      logger.error({ requestId, path, deckId }, "Deck not found, not owned by user, or not pending deletion.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found or not pending deletion.",
      });
    }

    // 2. Cancel the scheduled deletion
    await db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: null })
      .where(orm.and(orm.eq(schema.decks.id, deckId), orm.eq(schema.decks.userId, userId)));

    logger.info({ requestId, path, deckId }, "Deck deletion cancelled, deck restored.");

    return { restored: true };
  });
