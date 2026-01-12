import { orm, schema } from "@repo/db/db";
import { normalizeUsername } from "@repo/user-profile/normalized-username/normalized-username";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, createTestUserProfile, type TestContext } from "@/test-utils";

import { getPublicDecks } from "./get-public-decks";

const testRouter = createTRPCRouter({ getPublicDecks });
const createCaller = createCallerFactory(testRouter);

describe("getPublicDecks procedure", () => {
  let ctx: TestContext;
  const username = `testuser${Date.now()}`;
  const normalizedUsername = normalizeUsername(username);

  beforeEach(async () => {
    ctx = await createTestContext();
    await createTestUserProfile(ctx.db, ctx.userId, username);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return null when user profile doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPublicDecks({ normalizedUsername: normalizeUsername("nonexistent") });

    expect(result).toBeNull();
  });

  it("should return empty decks array when user has no public decks", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPublicDecks({ normalizedUsername });

    expect(result).not.toBeNull();
    expect(result?.decks).toEqual([]);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.getPublicDecks", normalizedUsername },
      "Fetching public decks for user.",
    );
  });

  it("should return only public decks", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Public Deck");
    const deck = await createTestDeck(ctx.db, ctx.userId, "Private Deck");
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPublicDecks({ normalizedUsername });

    expect(result?.decks).toHaveLength(1);
    expect(result?.decks[0]?.name).toBe("Public Deck");
  });

  it("should not return decks scheduled for deletion", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Active Public");

    const pendingDeck = await createTestDeck(ctx.db, ctx.userId, "Pending Deletion");
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, pendingDeck.id));

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPublicDecks({ normalizedUsername });

    expect(result?.decks).toHaveLength(1);
    expect(result?.decks[0]?.name).toBe("Active Public");
  });

  it("should return owner information", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Public Deck");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPublicDecks({ normalizedUsername });

    expect(result?.owner).toBeDefined();
    expect(result?.owner.username).toBe(username);
  });

  it("should reject non-normalized (uppercase) normalizedUsername", async () => {
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.getPublicDecks({ normalizedUsername: "NotNormalized" })).rejects.toThrow(
      "Username must be normalized (lowercase)",
    );
  });
});
