import { schema } from "@repo/db/db";
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

import { getMyFeed } from "./get-my-feed";

const testRouter = createTRPCRouter({ getMyFeed });
const createCaller = createCallerFactory(testRouter);

describe("getMyFeed procedure", () => {
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

  it("should return empty feed when I have no feed entries", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyFeed({ feedSource: "default" });

    expect(result.feed).toHaveLength(0);
    expect(result.nextCursor).toBeUndefined();

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "feeds.getMyFeed" },
      "Fetching user's feed list.",
    );
  });

  it("should return feed entries for me (myself)", async () => {
    // Create a feed entry
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: userUrl.id,
      deckId: deck.id,
    });

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyFeed({ feedSource: "default" });

    expect(result.feed).toHaveLength(1);
    expect(result.feed[0]?.userUrlId).toBe(userUrl.id);
  });

  it("should filter by feedSource author", async () => {
    // Create a feed entry
    await ctx.db.insert(schema.feeds).values({
      userId: ctx.userId,
      userUrlId: userUrl.id,
      deckId: deck.id,
    });

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyFeed({ feedSource: "author" });

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

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyFeed({ feedSource: "default", deckId: deck.id });

    expect(result.feed).toHaveLength(1);
    expect(result.feed[0]?.userUrlId).toBe(userUrl.id);
  });

  it("should return nextCursor when more items are available", async () => {
    // Create 11 feed entries (more than the default limit of 10)
    for (let i = 0; i < 11; i++) {
      const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId, `https://example.com/test${i}`);
      await ctx.db.insert(schema.feeds).values({
        userId: ctx.userId,
        userUrlId: urlData.userUrl.id,
        deckId: deck.id,
      });
    }

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyFeed({ feedSource: "default" });

    expect(result.feed).toHaveLength(10);
    expect(result.nextCursor).toBeDefined();
  });
});
