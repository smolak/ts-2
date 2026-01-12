import { orm, schema } from "@repo/db/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, createTestUserProfile, type TestContext } from "@/test-utils";

import { getFollowedDecks } from "./get-followed-decks";

const testRouter = createTRPCRouter({ getFollowedDecks });
const createCaller = createCallerFactory(testRouter);

describe("getFollowedDecks procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return empty array when user follows no decks", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getFollowedDecks();

    expect(result).toHaveLength(0);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.getFollowedDecks", userId: ctx.userId },
      "Fetching followed decks.",
    );
  });

  it("should return followed decks", async () => {
    const secondUser = await ctx.createAdditionalUser();
    const otherUsername = `otheruser_${Date.now()}`;
    await createTestUserProfile(ctx.db, secondUser.userId, otherUsername);
    const otherDeck = await createTestDeck(ctx.db, secondUser.userId, "Followed Deck");

    // Follow the deck
    await ctx.db.insert(schema.deckFollows).values({
      deckId: otherDeck.id,
      followerId: ctx.userId,
    });

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getFollowedDecks();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: otherDeck.id,
      name: "Followed Deck",
      owner: { username: otherUsername },
    });
  });

  it("should return multiple followed decks ordered by follow date", async () => {
    const secondUser = await ctx.createAdditionalUser();
    await createTestUserProfile(ctx.db, secondUser.userId, `otheruser_${Date.now()}`);
    const deck1 = await createTestDeck(ctx.db, secondUser.userId, "First Deck");
    const deck2 = await createTestDeck(ctx.db, secondUser.userId, "Second Deck");

    // Follow both decks
    await ctx.db.insert(schema.deckFollows).values({
      deckId: deck1.id,
      followerId: ctx.userId,
    });
    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
    await ctx.db.insert(schema.deckFollows).values({
      deckId: deck2.id,
      followerId: ctx.userId,
    });

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getFollowedDecks();

    expect(result).toHaveLength(2);
    // Most recently followed should be first
    expect(result[0]).toMatchObject({ id: deck2.id });
    expect(result[1]).toMatchObject({ id: deck1.id });
  });

  it("should return 0 decks when the only followed deck is scheduled for deletion", async () => {
    const secondUser = await ctx.createAdditionalUser();
    await createTestUserProfile(ctx.db, secondUser.userId, `otheruser_${Date.now()}`);
    const otherDeck = await createTestDeck(ctx.db, secondUser.userId, "Deleted Deck");

    // Follow the deck
    await ctx.db.insert(schema.deckFollows).values({
      deckId: otherDeck.id,
      followerId: ctx.userId,
    });

    // Schedule deck for deletion
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, otherDeck.id));

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getFollowedDecks();

    expect(result).toHaveLength(0);
  });

  it("should handle owner without profile gracefully", async () => {
    const secondUser = await ctx.createAdditionalUser();
    // Note: Not creating user profile
    const otherDeck = await createTestDeck(ctx.db, secondUser.userId, "No Profile Deck");

    // Follow the deck
    await ctx.db.insert(schema.deckFollows).values({
      deckId: otherDeck.id,
      followerId: ctx.userId,
    });

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getFollowedDecks();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      owner: { username: "Unknown" },
    });
  });
});
