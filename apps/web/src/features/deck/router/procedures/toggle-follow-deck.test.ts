import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { toggleFollowDeck } from "./toggle-follow-deck";

const testRouter = createTRPCRouter({ toggleFollowDeck });
const createCaller = createCallerFactory(testRouter);

describe("toggleFollowDeck procedure", () => {
  let ctx: TestContext;
  let publicDeck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    // Create a second user who owns the deck to follow
    const deckOwner = await ctx.createAdditionalUser();
    publicDeck = await createTestDeck(ctx.db, deckOwner.userId, "Public Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should follow a public deck", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.toggleFollowDeck({ deckId: publicDeck.id });

    expect(result.status).toBe("following");
    expect(result.deckId).toBe(publicDeck.id);
    expect(result.followersCount).toBe(1);

    const follow = await ctx.db.query.deckFollows.findFirst({
      where: (follows, { and, eq }) => and(eq(follows.deckId, publicDeck.id), eq(follows.followerId, ctx.userId)),
    });
    expect(follow).toBeDefined();

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.toggleFollowDeck",
        userId: ctx.userId,
        deckId: publicDeck.id,
        followersCount: 1,
      },
      "Deck followed.",
    );
  });

  it("should unfollow a previously followed deck", async () => {
    // First follow the deck
    await ctx.db.insert(schema.deckFollows).values({
      deckId: publicDeck.id,
      followerId: ctx.userId,
    });
    await ctx.db.update(schema.decks).set({ followersCount: 1 }).where(orm.eq(schema.decks.id, publicDeck.id));

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.toggleFollowDeck({ deckId: publicDeck.id });

    expect(result.status).toBe("unfollowed");
    expect(result.followersCount).toBe(0);

    const follow = await ctx.db.query.deckFollows.findFirst({
      where: (follows, { and, eq }) => and(eq(follows.deckId, publicDeck.id), eq(follows.followerId, ctx.userId)),
    });
    expect(follow).toBeUndefined();

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.toggleFollowDeck",
        userId: ctx.userId,
        deckId: publicDeck.id,
        followersCount: 0,
      },
      "Deck unfollowed.",
    );
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.toggleFollowDeck({ deckId: nonExistentDeckId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw BAD_REQUEST when trying to follow own deck", async () => {
    const myDeck = await createTestDeck(ctx.db, ctx.userId, "My Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.toggleFollowDeck({ deckId: myDeck.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot follow your own deck.",
    });
  });

  it("should throw BAD_REQUEST when trying to follow private deck", async () => {
    // Make deck private
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, publicDeck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.toggleFollowDeck({ deckId: publicDeck.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot follow private decks.",
    });
  });

  it("should throw BAD_REQUEST when trying to follow a deck scheduled for deletion", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, publicDeck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.toggleFollowDeck({ deckId: publicDeck.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot follow a deck scheduled for deletion.",
    });
  });
});
