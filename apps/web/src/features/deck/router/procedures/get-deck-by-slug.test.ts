import { orm, schema } from "@repo/db/db";
import type { Deck } from "@repo/db/types";
import { normalizeUsername } from "@repo/user-profile/normalized-username/normalized-username";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, createTestUserProfile, type TestContext } from "@/test-utils";

import { getDeckBySlug } from "./get-deck-by-slug";

const testRouter = createTRPCRouter({ getDeckBySlug });
const createCaller = createCallerFactory(testRouter);

describe("getDeckBySlug procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  const testUsername = `testuser_${Date.now()}`;
  const normalizedTestUsername = normalizeUsername(testUsername);

  beforeEach(async () => {
    ctx = await createTestContext();
    await createTestUserProfile(ctx.db, ctx.userId, testUsername);
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return public deck by normalizedUsername and slug", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckBySlug({ normalizedUsername: normalizedTestUsername, slug: deck.slug });

    expect(result).toMatchObject({
      id: deck.id,
      name: "Test Deck",
      slug: deck.slug,
      owner: { username: testUsername },
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.getDeckBySlug",
        normalizedUsername: normalizedTestUsername,
        slug: deck.slug,
      },
      "Fetching deck by slug.",
    );
  });

  it("should return null for non-existent normalizedUsername", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckBySlug({
      normalizedUsername: normalizeUsername("nonexistent_user"),
      slug: deck.slug,
    });

    expect(result).toBeNull();
  });

  it("should return null for non-existent slug", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckBySlug({ normalizedUsername: normalizedTestUsername, slug: "nonexistent-slug" });

    expect(result).toBeNull();
  });

  it("should return null for private deck when viewer is not owner", async () => {
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));
    const unauthCaller = createCaller(ctx.unauthTrpcContext);

    const result = await unauthCaller.getDeckBySlug({ normalizedUsername: normalizedTestUsername, slug: deck.slug });

    expect(result).toBeNull();
  });

  it("should return private deck when viewer is owner", async () => {
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckBySlug({ normalizedUsername: normalizedTestUsername, slug: deck.slug });

    expect(result).toMatchObject({ id: deck.id });
  });

  it("should return null for deck scheduled for deletion when viewer is not owner", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const unauthCaller = createCaller(ctx.unauthTrpcContext);

    const result = await unauthCaller.getDeckBySlug({ normalizedUsername: normalizedTestUsername, slug: deck.slug });

    expect(result).toBeNull();
  });

  it("should return isFollowing false for anonymous users", async () => {
    const unauthCaller = createCaller(ctx.unauthTrpcContext);

    const result = await unauthCaller.getDeckBySlug({ normalizedUsername: normalizedTestUsername, slug: deck.slug });

    expect(result).toMatchObject({ isFollowing: false });
  });

  it("should return isFollowing true when user is following the deck", async () => {
    const secondUser = await ctx.createAdditionalUser();

    // Add follow relationship
    await ctx.db.insert(schema.deckFollows).values({
      deckId: deck.id,
      followerId: secondUser.userId,
    });

    // Use the second user's existing clerkUserId
    const secondUserCaller = createCaller({
      ...ctx.trpcContext,
      auth: { ...ctx.trpcContext.auth, userId: secondUser.clerkUserId } as typeof ctx.trpcContext.auth,
    });

    const result = await secondUserCaller.getDeckBySlug({
      normalizedUsername: normalizedTestUsername,
      slug: deck.slug,
    });

    expect(result).toMatchObject({ isFollowing: true });
  });
});
