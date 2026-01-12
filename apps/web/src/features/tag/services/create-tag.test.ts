import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestContext, createTestDeck, createTestTag, type TestContext } from "@/test-utils";

import { createTag } from "./create-tag";
import { DeckNotFoundError, TagAlreadyExistsError } from "./errors";

describe("createTag service", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should create a tag with valid data", async () => {
    const result = await createTag({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
      displayName: "My Tag",
    });

    expect(result.tagId).toMatch(/^tag_/);
    expect(result.name).toBe("my tag");
    expect(result.displayName).toBe("My Tag");
  });

  it("should normalize tag name to lowercase", async () => {
    const result = await createTag({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
      displayName: "UPPERCASE Tag",
    });

    expect(result.name).toBe("uppercase tag");
    expect(result.displayName).toBe("UPPERCASE Tag");
  });

  it("should trim whitespace from displayName", async () => {
    const result = await createTag({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
      displayName: "  Trimmed Tag  ",
    });

    expect(result.name).toBe("trimmed tag");
    expect(result.displayName).toBe("  Trimmed Tag  ");
  });

  it("should throw DeckNotFoundError when deck doesn't exist", async () => {
    const nonExistentDeckId = generateDeckId();

    await expect(
      createTag({
        db: ctx.db,
        userId: ctx.userId,
        deckId: nonExistentDeckId,
        displayName: "Tag",
      }),
    ).rejects.toThrow(DeckNotFoundError);
  });

  it("should throw DeckNotFoundError when deck belongs to another user", async () => {
    const secondCtx = await createTestContext();
    const otherDeck = await createTestDeck(ctx.db, secondCtx.userId, "Other Deck");

    await expect(
      createTag({
        db: ctx.db,
        userId: ctx.userId,
        deckId: otherDeck.id,
        displayName: "Tag",
      }),
    ).rejects.toThrow(DeckNotFoundError);

    await secondCtx.cleanup();
  });

  it("should throw TagAlreadyExistsError when tag with same name exists", async () => {
    await createTestTag(ctx.db, deck.id, "Existing Tag");

    await expect(
      createTag({
        db: ctx.db,
        userId: ctx.userId,
        deckId: deck.id,
        displayName: "Existing Tag",
      }),
    ).rejects.toThrow(TagAlreadyExistsError);
  });

  it("should throw TagAlreadyExistsError for case-insensitive match", async () => {
    await createTestTag(ctx.db, deck.id, "My Tag");

    await expect(
      createTag({
        db: ctx.db,
        userId: ctx.userId,
        deckId: deck.id,
        displayName: "MY TAG",
      }),
    ).rejects.toThrow(TagAlreadyExistsError);
  });

  it("should allow same tag name in different decks", async () => {
    await createTestTag(ctx.db, deck.id, "Shared Name");
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Second Deck");

    const result = await createTag({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck2.id,
      displayName: "Shared Name",
    });

    expect(result.tagId).toMatch(/^tag_/);
    expect(result.displayName).toBe("Shared Name");
  });

  it("should create tag in the database", async () => {
    const result = await createTag({
      db: ctx.db,
      userId: ctx.userId,
      deckId: deck.id,
      displayName: "DB Test Tag",
    });

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag).toBeDefined();
    expect(createdTag?.deckId).toBe(deck.id);
    expect(createdTag?.urlsCount).toBe(0);
  });
});
