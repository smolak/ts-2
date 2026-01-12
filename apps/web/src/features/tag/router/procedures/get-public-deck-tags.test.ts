import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, createTestTag, type TestContext } from "@/test-utils";

import { getPublicDeckTags } from "./get-public-deck-tags";

const testRouter = createTRPCRouter({ getPublicDeckTags });
const createCaller = createCallerFactory(testRouter);

describe("getPublicDeckTags procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return tags for a public deck", async () => {
    await createTestTag(ctx.db, deck.id, "Tag One");
    await createTestTag(ctx.db, deck.id, "Tag Two");
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicDeckTags({ deckId: deck.id });

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.displayName)).toContain("Tag One");
    expect(result.map((t) => t.displayName)).toContain("Tag Two");
  });

  it("should return empty array when deck has no tags", async () => {
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicDeckTags({ deckId: deck.id });

    expect(result).toHaveLength(0);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.unauthTrpcContext.requestId, path: "tags.getPublicDeckTags", deckId: deck.id },
      "Fetching public deck's tags.",
    );
  });

  it("should throw NOT_FOUND for private deck", async () => {
    await ctx.db.update(schema.decks).set({ isPublic: false }).where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.unauthTrpcContext);

    await expect(caller.getPublicDeckTags({ deckId: deck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND for non-existent deck", async () => {
    const caller = createCaller(ctx.unauthTrpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.getPublicDeckTags({ deckId: nonExistentDeckId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND for deck scheduled for deletion", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.unauthTrpcContext);

    await expect(caller.getPublicDeckTags({ deckId: deck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should return tags ordered by name", async () => {
    await createTestTag(ctx.db, deck.id, "Zebra");
    await createTestTag(ctx.db, deck.id, "Apple");
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicDeckTags({ deckId: deck.id });

    expect(result[0]?.name).toBe("apple");
    expect(result[1]?.name).toBe("zebra");
  });
});
