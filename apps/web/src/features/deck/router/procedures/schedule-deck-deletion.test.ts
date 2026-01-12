import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { scheduleDeckDeletion } from "./schedule-deck-deletion";

const testRouter = createTRPCRouter({ scheduleDeckDeletion });
const createCaller = createCallerFactory(testRouter);

describe("scheduleDeckDeletion procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should schedule a deck for deletion", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.scheduleDeckDeletion({ deckId: deck.id });

    expect(result.scheduledForDeletionAt).toBeInstanceOf(Date);

    const updatedDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(updatedDeck?.scheduledForDeletionAt).toBeDefined();

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.scheduleDeckDeletion",
        userId: ctx.userId,
        deckId: deck.id,
        scheduledForDeletionAt: result.scheduledForDeletionAt,
      },
      "Deck scheduled for deletion.",
    );
  });

  it("should set scheduledForDeletionAt to approximately 30 minutes in the future", async () => {
    const caller = createCaller(ctx.trpcContext);
    const beforeCall = Date.now();

    const result = await caller.scheduleDeckDeletion({ deckId: deck.id });

    const afterCall = Date.now();
    const scheduledTime = result.scheduledForDeletionAt?.getTime() ?? 0;
    const thirtyMinutes = 30 * 60 * 1000;

    // Allow 1 second tolerance for test execution time
    expect(scheduledTime).toBeGreaterThanOrEqual(beforeCall + thirtyMinutes - 1000);
    expect(scheduledTime).toBeLessThanOrEqual(afterCall + thirtyMinutes + 1000);
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.scheduleDeckDeletion({ deckId: nonExistentDeckId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.scheduleDeckDeletion",
        userId: ctx.userId,
        deckId: nonExistentDeckId,
      },
      "Deck not found, not owned by user, or already pending deletion.",
    );
  });

  it("should throw NOT_FOUND when deck belongs to another user", async () => {
    const otherUser = await ctx.createAdditionalUser();
    const otherDeck = await createTestDeck(ctx.db, otherUser.userId, "Other Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.scheduleDeckDeletion({ deckId: otherDeck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND when deck is already pending deletion", async () => {
    // Schedule deck for deletion first
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.scheduleDeckDeletion({ deckId: deck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });
});
