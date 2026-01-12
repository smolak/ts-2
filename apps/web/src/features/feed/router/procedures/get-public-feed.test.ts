import { orm, schema } from "@repo/db/db";
import type { Deck, UserUrl } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import {
  createTestContext,
  createTestDeck,
  createTestUserProfile,
  createTestUserUrlWithUrl,
  type TestContext,
} from "@/test-utils";

import { getPublicFeed } from "./get-public-feed";

const testRouter = createTRPCRouter({ getPublicFeed });
const createCaller = createCallerFactory(testRouter);

describe("getPublicFeed procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  let userUrl: UserUrl;

  beforeEach(async () => {
    ctx = await createTestContext();
    await createTestUserProfile(ctx.db, ctx.userId, `testuser_${Date.now()}`);
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    userUrl = urlData.userUrl;
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return empty feed when the user has no public feed entries", async () => {
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicFeed({ userId: ctx.userId, feedSource: "default" });

    expect(result.feed).toHaveLength(0);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.unauthTrpcContext.requestId, path: "feeds.getPublicFeed" },
      "Fetching user's public feed list.",
    );
  });

  it("should return public feed entries for the user", async () => {
    // Create a feed entry for a public deck
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: userUrl.id,
      deckId: deck.id,
    });
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicFeed({ userId: ctx.userId, feedSource: "default" });

    expect(result.feed).toHaveLength(1);
    expect(result.feed[0]).toMatchObject({ userUrlId: userUrl.id });
  });

  it("should exclude entries from private decks", async () => {
    // Make deck private
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));

    // Create a feed entry
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: userUrl.id,
      deckId: deck.id,
    });
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicFeed({ userId: ctx.userId, feedSource: "default" });

    expect(result.feed).toHaveLength(0);
  });

  it("should filter by feedSource author", async () => {
    // Create a feed entry
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: userUrl.id,
      deckId: deck.id,
    });
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicFeed({ userId: ctx.userId, feedSource: "author" });

    expect(result.feed).toHaveLength(1);
  });

  it("should filter by deckId", async () => {
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Second Deck");
    const urlData2 = await createTestUserUrlWithUrl(ctx.db, ctx.userId);

    // Create feed entries for both decks
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: userUrl.id,
      deckId: deck.id,
    });
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: urlData2.userUrl.id,
      deckId: deck2.id,
    });
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicFeed({ userId: ctx.userId, feedSource: "default", deckId: deck.id });

    expect(result.feed).toHaveLength(1);
    expect(result.feed[0]).toMatchObject({ userUrlId: userUrl.id });
  });
});
