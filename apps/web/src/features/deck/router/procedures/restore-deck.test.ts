import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { restoreDeck } from "./restore-deck";

const testRouter = createTRPCRouter({ restoreDeck });
const createCaller = createCallerFactory(testRouter);

describe("restoreDeck procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    // Mark the deck as pending deletion
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date(Date.now() + 30 * 60 * 1000) })
      .where(orm.eq(schema.decks.id, deck.id));
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should restore a deck that is pending deletion", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.restoreDeck({ deckId: deck.id });

    expect(result).toEqual({ restored: true });

    const restoredDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(restoredDeck?.scheduledForDeletionAt).toBeNull();

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.restoreDeck", userId: ctx.userId, deckId: deck.id },
      "Deck deletion cancelled, deck restored.",
    );
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.restoreDeck({ deckId: nonExistentDeckId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found or not pending deletion.",
    });

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.restoreDeck", userId: ctx.userId, deckId: nonExistentDeckId },
      "Deck not found, not owned by user, or not pending deletion.",
    );
  });

  it("should throw NOT_FOUND when deck belongs to another user", async () => {
    const otherUser = await ctx.createAdditionalUser();
    const otherDeck = await createTestDeck(ctx.db, otherUser.userId, "Other Deck");
    // Mark it as pending deletion
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date(Date.now() + 30 * 60 * 1000) })
      .where(orm.eq(schema.decks.id, otherDeck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.restoreDeck({ deckId: otherDeck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found or not pending deletion.",
    });

    // Verify deck is still pending deletion
    const stillPendingDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, otherDeck.id),
    });
    expect(stillPendingDeck?.scheduledForDeletionAt).not.toBeNull();
  });

  it("should throw NOT_FOUND when deck is not pending deletion", async () => {
    // Clear the scheduled deletion
    await ctx.db.update(schema.decks).set({ scheduledForDeletionAt: null }).where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.restoreDeck({ deckId: deck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found or not pending deletion.",
    });
  });

  it("should throw NOT_FOUND when scheduled deletion time has already passed", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date(Date.now() - 1_000) })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.restoreDeck({ deckId: deck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found or not pending deletion.",
    });

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.restoreDeck", userId: ctx.userId, deckId: deck.id },
      "Deck not found, not owned by user, or not pending deletion.",
    );
  });
});
