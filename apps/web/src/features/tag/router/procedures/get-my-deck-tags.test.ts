import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, createTestTag, type TestContext } from "@/test-utils";

import { getMyDeckTags } from "./get-my-deck-tags";

const testRouter = createTRPCRouter({ getMyDeckTags });
const createCaller = createCallerFactory(testRouter);

describe("getMyDeckTags procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return empty array when deck has no tags", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyDeckTags({ deckId: deck.id });

    expect(result).toEqual([]);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "tags.getMyDeckTags", deckId: deck.id },
      "Fetching deck's tags.",
    );
  });

  it("should return all tags belonging to the deck", async () => {
    await createTestTag(ctx.db, deck.id, "Tag A");
    await createTestTag(ctx.db, deck.id, "Tag B");
    await createTestTag(ctx.db, deck.id, "Tag C");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyDeckTags({ deckId: deck.id });

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.displayName)).toContain("Tag A");
    expect(result.map((t) => t.displayName)).toContain("Tag B");
    expect(result.map((t) => t.displayName)).toContain("Tag C");
  });

  it("should return tags sorted by normalized name alphabetically", async () => {
    await createTestTag(ctx.db, deck.id, "Zebra");
    await createTestTag(ctx.db, deck.id, "Apple");
    await createTestTag(ctx.db, deck.id, "Mango");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyDeckTags({ deckId: deck.id });

    expect(result[0]?.name).toBe("apple");
    expect(result[1]?.name).toBe("mango");
    expect(result[2]?.name).toBe("zebra");
  });

  it("should not return tags from other decks", async () => {
    await createTestTag(ctx.db, deck.id, "My Tag");
    const otherDeck = await createTestDeck(ctx.db, ctx.userId, "Other Deck");
    await createTestTag(ctx.db, otherDeck.id, "Other Tag");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyDeckTags({ deckId: deck.id });

    expect(result).toHaveLength(1);
    expect(result[0]?.displayName).toBe("My Tag");
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.getMyDeckTags({ deckId: nonExistentDeckId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND when accessing another user's deck", async () => {
    const otherUser = await ctx.createAdditionalUser();
    const otherDeck = await createTestDeck(ctx.db, otherUser.userId, "Other Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.getMyDeckTags({ deckId: otherDeck.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should include urlsCount in returned tags", async () => {
    const tag = await createTestTag(ctx.db, deck.id, "Tag With Count");
    await ctx.db.update(schema.tags).set({ urlsCount: 10 }).where(orm.eq(schema.tags.id, tag.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyDeckTags({ deckId: deck.id });

    expect(result[0]?.urlsCount).toBe(10);
  });

  it("should return tags with correct data format", async () => {
    await createTestTag(ctx.db, deck.id, "Complete Tag");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getMyDeckTags({ deckId: deck.id });

    expect(result[0]?.id).toMatch(/^tag_/);
    expect(result[0]?.name).toBe("complete tag"); // Normalized
    expect(result[0]?.displayName).toBe("Complete Tag");
    expect(typeof result[0]?.urlsCount).toBe("number");
  });
});
