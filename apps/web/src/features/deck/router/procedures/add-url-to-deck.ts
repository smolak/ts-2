import { orm, schema } from "@repo/db/db";
import { deckIdSchema } from "@repo/db/id/deck-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import type { Deck } from "@repo/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

const addUrlToDeckSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
});

export type AddUrlToDeckSchema = z.infer<typeof addUrlToDeckSchema>;

type AddUrlToDeckResult = {
  added: true;
  deckId: Deck["id"];
  urlsCount: Deck["urlsCount"];
};

export const addUrlToDeck = protectedProcedure
  .input(addUrlToDeckSchema)
  .mutation<AddUrlToDeckResult>(async ({ input: { deckId, userUrlId }, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.addUrlToDeck";

    // 1. Verify deck and userUrl exist and belong to user (parallel queries)
    const [deck, userUrl] = await Promise.all([
      db.query.decks.findFirst({
        where: (decks, { and, eq, isNull }) =>
          and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
        columns: { id: true, isPublic: true, urlsCount: true },
      }),
      db.query.usersUrls.findFirst({
        where: (usersUrls, { and, eq }) => and(eq(usersUrls.id, userUrlId), eq(usersUrls.userId, userId)),
        columns: { id: true },
      }),
    ]);

    if (!deck) {
      logger.error({ requestId, path, deckId }, "Deck not found, not owned by user, or pending deletion.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    if (!userUrl) {
      logger.error({ requestId, path, userUrlId }, "URL not found or not owned by user.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "URL not found.",
      });
    }

    // 2. Check if user URL is already in deck
    const existingDeckUrl = await db.query.deckUrls.findFirst({
      where: (deckUrls, { and, eq }) => and(eq(deckUrls.deckId, deckId), eq(deckUrls.userUrlId, userUrlId)),
      columns: { deckId: true },
    });

    if (existingDeckUrl) {
      logger.warn({ requestId, path, deckId, userUrlId }, "URL is already in this deck.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "URL is already in this deck.",
      });
    }

    const result = await db.transaction(async (tx) => {
      // 3. Add URL to deck
      await tx.insert(schema.deckUrls).values({ deckId, userUrlId });

      // 4. Increment deck.urls_count
      const [updatedDeck] = await tx
        .update(schema.decks)
        .set({ urlsCount: orm.sql`${schema.decks.urlsCount} + 1` })
        .where(orm.eq(schema.decks.id, deckId))
        .returning({ urlsCount: schema.decks.urlsCount });

      const newUrlsCount = updatedDeck?.urlsCount ?? deck.urlsCount + 1;

      // 5. If deck is public, fan-out to feeds of deck followers
      if (deck.isPublic) {
        const followers = await tx.query.deckFollows.findMany({
          where: (follows, { eq }) => eq(follows.deckId, deckId),
          columns: { followerId: true },
        });

        if (followers.length > 0) {
          await tx.insert(schema.feeds).values(
            followers.map((follower) => ({
              userId: follower.followerId,
              userUrlId,
              deckId,
            })),
          );

          logger.info({ requestId, path, deckId, followersCount: followers.length }, "Feed fan-out completed.");
        }
      }

      return { urlsCount: newUrlsCount };
    });

    logger.info({ requestId, path, deckId, userUrlId, urlsCount: result.urlsCount }, "URL added to deck.");

    return { added: true, deckId, urlsCount: result.urlsCount };
  });
