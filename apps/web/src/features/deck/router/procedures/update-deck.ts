import { orm, schema } from "@repo/db/db";
import type { Deck } from "@repo/db/types";
import { canChangeDeckVisibility } from "@repo/deck/config/deck-limits";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { updateDeckSchema } from "../../schemas/update-deck.schema";

type UpdateDeckResult = {
  deckId: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  isPublic: Deck["isPublic"];
};

export const updateDeck = protectedProcedure
  .input(updateDeckSchema)
  .mutation<UpdateDeckResult>(async ({ input, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.updateDeck";
    const { deckId, name, slug, metadata, isPublic } = input;

    // 1. Find the existing deck and verify ownership
    const existingDeck = await db.query.decks.findFirst({
      where: (decks, { and, eq }) => and(eq(decks.id, deckId), eq(decks.userId, userId)),
    });

    if (!existingDeck) {
      logger.error({ requestId, path, deckId }, "Deck not found or not owned by user.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    // 2. Cannot update a pending-deletion deck
    if (existingDeck.scheduledForDeletionAt) {
      logger.warn({ requestId, path, deckId }, "Cannot update a deck scheduled for deletion.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot update a deck scheduled for deletion. Restore it first.",
      });
    }

    // 3. If changing visibility, check limits
    if (isPublic !== undefined && isPublic !== existingDeck.isPublic) {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        columns: { plan: true },
      });

      if (!user) {
        logger.error({ requestId, path }, "User not found.");
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      const deckCounts = await db
        .select({
          publicCount: orm.sql<number>`COUNT(*) FILTER (WHERE is_public = true)`.mapWith(Number),
          privateCount: orm.sql<number>`COUNT(*) FILTER (WHERE is_public = false)`.mapWith(Number),
        })
        .from(schema.decks)
        .where(orm.eq(schema.decks.userId, userId));

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
        logger.error({ requestId, path }, `Deck with slug (${slug}) already exists.`);
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
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // 6. Update deck
    const [updatedDeck] = await db
      .update(schema.decks)
      .set(updateData)
      .where(orm.and(orm.eq(schema.decks.id, deckId), orm.eq(schema.decks.userId, userId)))
      .returning({
        deckId: schema.decks.id,
        name: schema.decks.name,
        slug: schema.decks.slug,
        isPublic: schema.decks.isPublic,
      });

    if (!updatedDeck) {
      logger.error({ requestId, path }, "Deck could not be updated.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Deck could not be updated, try again.",
      });
    }

    logger.info({ requestId, path, deckId: updatedDeck.deckId }, "Deck updated.");

    return updatedDeck;
  });
