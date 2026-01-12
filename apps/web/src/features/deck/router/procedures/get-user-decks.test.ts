import { orm, schema } from "@repo/db/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { getUserDecks } from "./get-user-decks";

const testRouter = createTRPCRouter({ getUserDecks });
const createCaller = createCallerFactory(testRouter);

describe("getUserDecks procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return empty array when user has no decks", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserDecks();

    expect(result).toEqual([]);

    // Verify logging
    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.getUserDecks", userId: ctx.userId },
      "Fetching user's decks.",
    );
    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.getUserDecks", userId: ctx.userId, count: 0 },
      "User's decks fetched.",
    );
  });

  it("should return user's decks", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Deck 1");
    await createTestDeck(ctx.db, ctx.userId, "Deck 2");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserDecks();

    expect(result).toHaveLength(2);
    expect(result.map((d) => d.name)).toContain("Deck 1");
    expect(result.map((d) => d.name)).toContain("Deck 2");
  });

  it("should not return decks from other users", async () => {
    await createTestDeck(ctx.db, ctx.userId, "My Deck");
    const otherUser = await ctx.createAdditionalUser();
    await createTestDeck(ctx.db, otherUser.userId, "Other User Deck");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserDecks();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("My Deck");
  });

  it("should not return decks scheduled for deletion", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Active Deck");
    const pendingDeck = await createTestDeck(ctx.db, ctx.userId, "Pending Deck");
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, pendingDeck.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserDecks();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Active Deck");
  });

  it("should order decks by createdAt descending (newest first)", async () => {
    // Create decks with slight delay to ensure different timestamps
    await createTestDeck(ctx.db, ctx.userId, "First Deck");
    await createTestDeck(ctx.db, ctx.userId, "Second Deck");
    await createTestDeck(ctx.db, ctx.userId, "Third Deck");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserDecks();

    expect(result).toHaveLength(3);
    // Newest deck should be first
    expect(result[0]?.name).toBe("Third Deck");
    expect(result[1]?.name).toBe("Second Deck");
    expect(result[2]?.name).toBe("First Deck");
  });
});
