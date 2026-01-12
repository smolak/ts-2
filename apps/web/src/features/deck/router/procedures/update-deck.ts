import { orm, schema } from "@repo/db/db";
import type { Deck } from "@repo/db/types";
import { canChangeDeckVisibility } from "@repo/deck/config/deck-limits";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { updateDeckSchema } from "../../schemas/update-deck.schema";

type UpdateDeckResult = {
  deckId: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  isPublic: Deck["isPublic"];
  metadata: DeckMetadata;
};

export const updateDeck = protectedProcedure
  .input(updateDeckSchema)
  .mutation<UpdateDeckResult>(async ({ input, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.updateDeck";
    const { deckId, name, slug, metadata, isPublic } = input;

    // 1. Find the existing deck and verify ownership
    const existingDeck = await db.query.decks.findFirst({
      where: (decks, { and, eq }) => and(eq(decks.id, deckId), eq(decks.userId, userId)),
      columns: { userId: true, slug: true, isPublic: true, scheduledForDeletionAt: true },
    });

    if (!existingDeck) {
      logger.error({ requestId, path, userId, deckId }, "Deck not found or not owned by user.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    // 2. Cannot update a pending-deletion deck
    if (existingDeck.scheduledForDeletionAt) {
      logger.warn({ requestId, path, userId, deckId }, "Cannot update a deck scheduled for deletion.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot update a deck scheduled for deletion. Restore it first.",
      });
    }

    // 3. If changing visibility, check limits (parallel queries)
    if (isPublic !== undefined && isPublic !== existingDeck.isPublic) {
      const [user, deckCounts] = await Promise.all([
        db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, userId),
          columns: { plan: true },
        }),
        db
          .select({
            publicCount: orm.sql<number>`COUNT(*) FILTER (WHERE is_public = true)`.mapWith(Number),
            privateCount: orm.sql<number>`COUNT(*) FILTER (WHERE is_public = false)`.mapWith(Number),
          })
          .from(schema.decks)
          .where(orm.eq(schema.decks.userId, userId)),
      ]);

      if (!user) {
        logger.error({ requestId, path, userId }, "User not found.");
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      const { publicCount, privateCount } = deckCounts[0] ?? { publicCount: 0, privateCount: 0 };

      const canChange = canChangeDeckVisibility(user.plan, publicCount, privateCount, existingDeck.isPublic, isPublic);

      if (!canChange.allowed) {
        logger.warn({ requestId, path, userId, plan: user.plan }, canChange.reason);
        throw new TRPCError({
          code: "FORBIDDEN",
          message: canChange.reason,
        });
      }
    }

    // 4. If changing slug, check for conflicts
    if (slug && slug !== existingDeck.slug) {
      const slugConflict = await db.query.decks.findFirst({
        where: (decks, { and, eq, not }) =>
          and(eq(decks.userId, userId), eq(decks.slug, slug), not(eq(decks.id, deckId))),
        columns: { id: true },
      });

      if (slugConflict) {
        logger.error({ requestId, path, userId, slug }, "Deck with this slug already exists.");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deck with this slug already exists.",
        });
      }
    }

    // 5. Build update object
    const updateData: Partial<{
      name: string;
      slug: string;
      metadata: Record<string, unknown>;
      isPublic: boolean;
      followersCount: number;
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // 6. If deck is being made private, remove all followers
    const isBeingMadePrivate = existingDeck.isPublic && isPublic === false;
    let followersToProcess: { followerId: string }[] = [];

    if (isBeingMadePrivate) {
      // Get all followers before deletion (for profile count updates)
      followersToProcess = await db.query.deckFollows.findMany({
        where: (follows, { eq }) => eq(follows.deckId, deckId),
        columns: { followerId: true },
      });

      // Reset followers count to 0 since we're removing all followers
      updateData.followersCount = 0;

      logger.info(
        { requestId, path, userId, deckId, followersCount: followersToProcess.length },
        "Deck made private, removing all followers.",
      );
    }

    // 7. Update deck and handle follower cleanup in a transaction
    const updatedDeck = await db.transaction(async (tx) => {
      // Delete all deck_follows entries if deck is being made private
      if (isBeingMadePrivate && followersToProcess.length > 0) {
        await tx.delete(schema.deckFollows).where(orm.eq(schema.deckFollows.deckId, deckId));

        // For each unique follower, check if they still follow other decks from this owner
        for (const { followerId } of followersToProcess) {
          const remainingFollows = await tx.query.deckFollows.findMany({
            where: (follows, { eq }) => eq(follows.followerId, followerId),
            with: { deck: { columns: { userId: true } } },
          });
          const stillFollowingOwner = remainingFollows.some((f) => f.deck.userId === existingDeck.userId);

          // If not following any other deck from this owner, decrement their profile followers count
          if (!stillFollowingOwner) {
            await tx
              .update(schema.userProfiles)
              .set({ followersCount: orm.sql`GREATEST(${schema.userProfiles.followersCount} - 1, 0)` })
              .where(orm.eq(schema.userProfiles.userId, existingDeck.userId));

            logger.info(
              { requestId, path, userId, deckOwnerId: existingDeck.userId, followerId },
              "Decremented deck owner's profile followers count (follower no longer follows any of their decks).",
            );
          }
        }
      }

      // Update the deck
      const [result] = await tx
        .update(schema.decks)
        .set(updateData)
        .where(orm.and(orm.eq(schema.decks.id, deckId), orm.eq(schema.decks.userId, userId)))
        .returning({
          deckId: schema.decks.id,
          name: schema.decks.name,
          slug: schema.decks.slug,
          isPublic: schema.decks.isPublic,
          metadata: schema.decks.metadata,
        });

      return result as typeof result & { metadata: DeckMetadata };
    });

    if (!updatedDeck) {
      logger.error({ requestId, path, userId, deckId }, "Deck could not be updated.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Deck could not be updated, try again.",
      });
    }

    if (isBeingMadePrivate && followersToProcess.length > 0) {
      logger.info(
        { requestId, path, userId, deckId: updatedDeck.deckId, removedFollowersCount: followersToProcess.length },
        "Deck made private, all followers removed.",
      );
    }

    logger.info({ requestId, path, userId, deckId: updatedDeck.deckId }, "Deck updated.");

    return updatedDeck;
  });
