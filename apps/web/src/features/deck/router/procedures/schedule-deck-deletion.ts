import { orm, schema } from "@repo/db/db";
import type { Deck } from "@repo/db/types";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { scheduleDeckDeletionSchema } from "../../schemas/schedule-deck-deletion.schema";

const DECK_DELETION_GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

type ScheduleDeckDeletionResult = {
  scheduledForDeletionAt: Deck["scheduledForDeletionAt"];
};

export const scheduleDeckDeletion = protectedProcedure
  .input(scheduleDeckDeletionSchema)
  .mutation<ScheduleDeckDeletionResult>(async ({ input: { deckId }, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.scheduleDeckDeletion";

    // 1. Verify deck exists, belongs to user, and is not already pending deletion
    const existingDeck = await db.query.decks.findFirst({
      where: (decks, { and, eq, isNull }) =>
        and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
      columns: { id: true },
    });

    if (!existingDeck) {
      logger.error({ requestId, path, deckId }, "Deck not found, not owned by user, or already pending deletion.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    // 2. Schedule deck for deletion (pending deletion pattern)
    const scheduledForDeletionAt = new Date(Date.now() + DECK_DELETION_GRACE_PERIOD_MS);

    await db
      .update(schema.decks)
      .set({ scheduledForDeletionAt })
      .where(orm.and(orm.eq(schema.decks.id, deckId), orm.eq(schema.decks.userId, userId)));

    logger.info({ requestId, path, deckId, scheduledForDeletionAt }, "Deck scheduled for deletion.");

    return { scheduledForDeletionAt };
  });

