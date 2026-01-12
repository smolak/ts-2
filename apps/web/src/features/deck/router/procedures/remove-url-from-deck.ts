import { orm, schema } from "@repo/db/db";
import { deckIdSchema } from "@repo/db/id/deck-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import type { Deck } from "@repo/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

const removeUrlFromDeckSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
});

export type RemoveUrlFromDeckSchema = z.infer<typeof removeUrlFromDeckSchema>;

type RemoveUrlFromDeckResult = {
  removed: true;
  urlsCount: Deck["urlsCount"];
};

export const removeUrlFromDeck = protectedProcedure
  .input(removeUrlFromDeckSchema)
  .mutation<RemoveUrlFromDeckResult>(
    async ({ input: { deckId, userUrlId }, ctx: { logger, requestId, userId, db } }) => {
      const path = "deck.removeUrlFromDeck";

      // 1. Verify deck ownership and URL existence in deck (parallel queries)
      const [deck, existingDeckUrl] = await Promise.all([
        db.query.decks.findFirst({
          where: (decks, { and, eq, isNull }) =>
            and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
          columns: { id: true, urlsCount: true },
        }),
        db.query.deckUrls.findFirst({
          where: (deckUrls, { and, eq }) => and(eq(deckUrls.deckId, deckId), eq(deckUrls.userUrlId, userUrlId)),
          columns: { deckId: true },
        }),
      ]);

      if (!deck) {
        logger.error({ requestId, path, userId, deckId }, "Deck not found, not owned by user, or pending deletion.");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deck not found.",
        });
      }

      if (!existingDeckUrl) {
        logger.warn({ requestId, path, userId, deckId, userUrlId }, "URL is not in this deck.");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL is not in this deck.",
        });
      }

      // 2. Remove URL from deck and decrement count
      const { urlsCount: newUrlsCount } = await db.transaction(async (tx) => {
        const [[updatedDeck]] = await Promise.all([
          tx
            .update(schema.decks)
            .set({ urlsCount: orm.sql`GREATEST(${schema.decks.urlsCount} - 1, 0)` })
            .where(orm.eq(schema.decks.id, deckId))
            .returning({ urlsCount: schema.decks.urlsCount }),

          tx
            .delete(schema.deckUrls)
            .where(orm.and(orm.eq(schema.deckUrls.deckId, deckId), orm.eq(schema.deckUrls.userUrlId, userUrlId))),
        ]);

        return {
          urlsCount: updatedDeck?.urlsCount ?? Math.max(deck.urlsCount - 1, 0),
        };
      });

      // Note: We don't remove from feeds (historical record)

      logger.info({ requestId, path, userId, deckId, userUrlId, urlsCount: newUrlsCount }, "URL removed from deck.");

      return { removed: true, urlsCount: newUrlsCount };
    },
  );
