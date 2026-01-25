import { orm, schema } from "@repo/db/db";
import { type DeckId, deckIdSchema } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

const toggleFollowDeckSchema = z.object({
  deckId: deckIdSchema,
});

export type ToggleFollowDeckSchema = z.infer<typeof toggleFollowDeckSchema>;

type ToggleFollowDeckResult = {
  status: "following" | "unfollowed";
  deckId: DeckId;
  followersCount: Deck["followersCount"];
};

export const toggleFollowDeck = protectedProcedure
  .input(toggleFollowDeckSchema)
  .mutation<ToggleFollowDeckResult>(async ({ input: { deckId }, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.toggleFollowDeck";

    // 1. Get deck and check if already following (parallel queries)
    const [deck, existingFollow] = await Promise.all([
      db.query.decks.findFirst({
        where: (decks, { eq }) => eq(decks.id, deckId),
        columns: { id: true, isPublic: true, userId: true, followersCount: true, scheduledForDeletionAt: true },
      }),
      db.query.deckFollows.findFirst({
        where: (follows, { and, eq }) => and(eq(follows.deckId, deckId), eq(follows.followerId, userId)),
        columns: { deckId: true },
      }),
    ]);

    if (!deck) {
      logger.error({ requestId, path, userId, deckId }, "Deck not found.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    // 2. Cannot follow pending-deletion decks
    if (deck.scheduledForDeletionAt) {
      logger.warn({ requestId, path, userId, deckId }, "Cannot follow a deck scheduled for deletion.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot follow a deck scheduled for deletion.",
      });
    }

    // 3. Cannot follow private decks
    if (!deck.isPublic) {
      logger.warn({ requestId, path, userId, deckId }, "Cannot follow private deck.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot follow private decks.",
      });
    }

    // 4. Cannot follow your own deck
    if (deck.userId === userId) {
      logger.warn({ requestId, path, userId, deckId }, "Cannot follow own deck.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot follow your own deck.",
      });
    }

    if (existingFollow) {
      // Unfollow
      const { followersCount: newFollowersCount } = await db.transaction(async (tx) => {
        const [[updatedDeck]] = await Promise.all([
          tx
            .update(schema.decks)
            .set({ followersCount: orm.sql`GREATEST(${schema.decks.followersCount} - 1, 0)` })
            .where(orm.eq(schema.decks.id, deckId))
            .returning({ followersCount: schema.decks.followersCount }),

          tx
            .delete(schema.deckFollows)
            .where(orm.and(orm.eq(schema.deckFollows.deckId, deckId), orm.eq(schema.deckFollows.followerId, userId))),
        ]);

        // Check if user still follows any other deck from this owner (for deduplicated count)
        // After the delete, check remaining follows
        const remainingFollows = await tx.query.deckFollows.findMany({
          where: (follows, { eq }) => eq(follows.followerId, userId),
          with: { deck: { columns: { userId: true } } },
        });
        const stillFollowingOwner = remainingFollows.some((f) => f.deck.userId === deck.userId);

        // If not following any other deck from this owner, decrement their profile followers count
        if (!stillFollowingOwner) {
          await tx
            .update(schema.userProfiles)
            .set({ followersCount: orm.sql`GREATEST(${schema.userProfiles.followersCount} - 1, 0)` })
            .where(orm.eq(schema.userProfiles.userId, deck.userId));

          logger.info(
            { requestId, path, userId, deckOwnerId: deck.userId },
            "Decremented deck owner's profile followers count.",
          );
        }

        return {
          followersCount: updatedDeck?.followersCount ?? Math.max(deck.followersCount - 1, 0),
        };
      });

      // Note: We don't remove from feeds (historical record)

      logger.info({ requestId, path, userId, deckId, followersCount: newFollowersCount }, "Deck unfollowed.");

      return { status: "unfollowed", deckId, followersCount: newFollowersCount };
    }

    // Check if this is the first deck from this owner that the user is following
    // (for deduplicated profile followers count)
    const currentFollows = await db.query.deckFollows.findMany({
      where: (follows, { eq }) => eq(follows.followerId, userId),
      with: { deck: { columns: { userId: true } } },
    });
    const wasFollowingOwnerBefore = currentFollows.some((f) => f.deck.userId === deck.userId);

    // Follow
    const { followersCount: newFollowersCount } = await db.transaction(async (tx) => {
      const [[updatedDeck]] = await Promise.all([
        tx
          .update(schema.decks)
          .set({ followersCount: orm.sql`${schema.decks.followersCount} + 1` })
          .where(orm.eq(schema.decks.id, deckId))
          .returning({ followersCount: schema.decks.followersCount }),

        tx.insert(schema.deckFollows).values({ deckId, followerId: userId }),
      ]);

      // If this is the first deck from this owner, increment their profile followers count
      if (!wasFollowingOwnerBefore) {
        await tx
          .update(schema.userProfiles)
          .set({ followersCount: orm.sql`${schema.userProfiles.followersCount} + 1` })
          .where(orm.eq(schema.userProfiles.userId, deck.userId));

        logger.info(
          { requestId, path, userId, deckOwnerId: deck.userId },
          "Incremented deck owner's profile followers count.",
        );
      }

      return {
        followersCount: updatedDeck?.followersCount ?? deck.followersCount + 1,
      };
    });

    logger.info({ requestId, path, userId, deckId, followersCount: newFollowersCount }, "Deck followed.");

    return { status: "following", deckId, followersCount: newFollowersCount };
  });
