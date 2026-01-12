import { orm, schema } from "@repo/db/db";
import type { Deck } from "@repo/db/types";
import { canCreateDeck } from "@repo/deck/config/deck-limits";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { createDeckSchema } from "../../schemas/create-deck.schema";

type CreateDeckResult = {
  deckId: Deck["id"];
  slug: Deck["slug"];
};

export const createDeck = protectedProcedure
  .input(createDeckSchema)
  .mutation<CreateDeckResult>(async ({ input, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.createDeck";
    const { name, slug, metadata, isPublic } = input;

    // 1. Fetch user plan, deck counts, and check slug uniqueness (parallel queries)
    const [user, deckCounts, existingDeck] = await Promise.all([
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
      db.query.decks.findFirst({
        where: (decks, { and, eq }) => and(eq(decks.userId, userId), eq(decks.slug, slug)),
        columns: { id: true },
      }),
    ]);

    if (!user) {
      logger.error({ requestId, path, userId }, "User not found.");
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    if (existingDeck) {
      logger.error({ requestId, path, userId, slug }, "Deck with this slug already exists.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Deck with this slug already exists.",
      });
    }

    const { publicCount, privateCount } = deckCounts[0] ?? { publicCount: 0, privateCount: 0 };

    // 2. Check limits
    const canCreate = canCreateDeck(user.plan, publicCount, privateCount, isPublic);

    if (!canCreate.allowed) {
      logger.warn({ requestId, path, userId, plan: user.plan }, canCreate.reason);

      throw new TRPCError({
        code: "FORBIDDEN",
        message: canCreate.reason,
      });
    }

    // 3. Create deck
    const [result] = await db
      .insert(schema.decks)
      .values({
        userId,
        name,
        slug,
        metadata: metadata ?? {},
        isPublic,
      })
      .returning({ insertedId: schema.decks.id, slug: schema.decks.slug });

    if (!result) {
      logger.error({ requestId, path, userId }, "Deck ID not retrieved for created deck.");
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Deck could not be created.",
      });
    }

    logger.info({ requestId, path, userId, deckId: result.insertedId, name, slug }, "Deck created.");

    return { deckId: result.insertedId, slug: result.slug };
  });
