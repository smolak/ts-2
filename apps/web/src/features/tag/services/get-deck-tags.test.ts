import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestContext, createTestDeck, createTestTag, type TestContext } from "@/test-utils";

import { DeckNotFoundError } from "./errors";
import { getDeckTags } from "./get-deck-tags";

describe("getDeckTags service", () => {
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
    const result = await getDeckTags({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
    });

    expect(result.tags).toEqual([]);
  });

  it("should return tags for a deck", async () => {
    await createTestTag(ctx.db, deck.id, "Tag 1");
    await createTestTag(ctx.db, deck.id, "Tag 2");

    const result = await getDeckTags({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
    });

    expect(result.tags).toHaveLength(2);
    expect(result.tags.map((t) => t.displayName)).toContain("Tag 1");
    expect(result.tags.map((t) => t.displayName)).toContain("Tag 2");
  });

  it("should return tags ordered by name ascending", async () => {
    await createTestTag(ctx.db, deck.id, "Zebra");
    await createTestTag(ctx.db, deck.id, "Alpha");
    await createTestTag(ctx.db, deck.id, "Middle");

    const result = await getDeckTags({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
    });

    expect(result.tags[0]?.displayName).toBe("Alpha");
    expect(result.tags[1]?.displayName).toBe("Middle");
    expect(result.tags[2]?.displayName).toBe("Zebra");
  });

  it("should throw DeckNotFoundError when deck doesn't exist", async () => {
    const nonExistentDeckId = generateDeckId();

    await expect(
      getDeckTags({
        db: ctx.db,
        userId: ctx.userId,
        deckId: nonExistentDeckId,
      }),
    ).rejects.toThrow(DeckNotFoundError);
  });

  it("should throw DeckNotFoundError when deck belongs to another user", async () => {
    const secondCtx = await createTestContext();
    const otherDeck = await createTestDeck(ctx.db, secondCtx.userId, "Other Deck");
    await createTestTag(ctx.db, otherDeck.id, "Other Tag");

    await expect(
      getDeckTags({
        db: ctx.db,
        userId: ctx.userId,
        deckId: otherDeck.id,
      }),
    ).rejects.toThrow(DeckNotFoundError);

    await secondCtx.cleanup();
  });

  it("should not return tags from other decks", async () => {
    await createTestTag(ctx.db, deck.id, "My Tag");
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Second Deck");
    await createTestTag(ctx.db, deck2.id, "Other Deck Tag");

    const result = await getDeckTags({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
    });

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0]?.displayName).toBe("My Tag");
  });
});
