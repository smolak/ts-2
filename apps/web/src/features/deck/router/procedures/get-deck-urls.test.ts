import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck, UserUrl } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import {
  createTestContext,
  createTestDeck,
  createTestDeckUrl,
  createTestUserUrlWithUrl,
  type TestContext,
} from "@/test-utils";

import { getDeckUrls } from "./get-deck-urls";

const testRouter = createTRPCRouter({ getDeckUrls });
const createCaller = createCallerFactory(testRouter);

describe("getDeckUrls procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  let userUrl: UserUrl;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId, "https://example.com/test");
    userUrl = urlData.userUrl;
    await createTestDeckUrl(ctx.db, deck.id, userUrl.id);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return deck URLs for a public deck", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrls({ deckId: deck.id });

    expect(result).not.toBeNull();
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({
      userUrlId: userUrl.id,
      url: "https://example.com/test",
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.getDeckUrls",
        deckId: deck.id,
        tagIds: [],
        limit: 20,
        cursor: undefined,
      },
      "Fetching deck URLs.",
    );
  });

  it("should return null for non-existent deck", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    const result = await caller.getDeckUrls({ deckId: nonExistentDeckId });

    expect(result).toBeNull();
  });

  it("should return null for private deck when viewer is not owner", async () => {
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));
    const unauthCaller = createCaller(ctx.unauthTrpcContext);

    const result = await unauthCaller.getDeckUrls({ deckId: deck.id });

    expect(result).toBeNull();
  });

  it("should return URLs for private deck when viewer is owner", async () => {
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrls({ deckId: deck.id });

    expect(result).not.toBeNull();
    expect(result?.items).toHaveLength(1);
  });

  it("should return null for deck scheduled for deletion when viewer is not owner", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const unauthCaller = createCaller(ctx.unauthTrpcContext);

    const result = await unauthCaller.getDeckUrls({ deckId: deck.id });

    expect(result).toBeNull();
  });

  it("should handle pagination with limit", async () => {
    // Add more URLs
    for (let i = 0; i < 3; i++) {
      const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId, `https://example.com/test${i}`);
      await createTestDeckUrl(ctx.db, deck.id, urlData.userUrl.id);
    }

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrls({ deckId: deck.id, limit: 2 });

    expect(result?.items).toHaveLength(2);
    expect(result?.nextCursor).toBeDefined();
  });

  it("should return empty array when deck has no URLs", async () => {
    const emptyDeck = await createTestDeck(ctx.db, ctx.userId, "Empty Deck");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrls({ deckId: emptyDeck.id });

    expect(result).not.toBeNull();
    expect(result?.items).toHaveLength(0);
  });
});
