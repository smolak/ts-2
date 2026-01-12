import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, createTestTag, type TestContext } from "@/test-utils";

import { createTag } from "./create-tag";

const testRouter = createTRPCRouter({ createTag });
const createCaller = createCallerFactory(testRouter);

describe("createTag procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should create a tag in a deck with valid name", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck.id, name: "My New Tag" });

    expect(result).toMatchObject({
      displayName: "My New Tag",
      name: "my new tag", // Normalized
    });
    expect(result.tagId).toMatch(/^tag_/);

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag).toMatchObject({
      name: "my new tag", // Normalized
      displayName: "My New Tag",
      deckId: deck.id,
      urlsCount: 0,
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "tag.createTag",
        deckId: deck.id,
        name: "my new tag",
        displayName: "My New Tag",
      },
      "Tag created.",
    );
  });

  it("should throw BAD_REQUEST when tag name already exists in deck", async () => {
    await createTestTag(ctx.db, deck.id, "Duplicate Tag");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.createTag({ deckId: deck.id, name: "Duplicate Tag" })).rejects.toThrow(TRPCError);
    await expect(caller.createTag({ deckId: deck.id, name: "duplicate tag" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Tag name already exists in this deck. Use a different name.",
    });

    const tagsWithName = await ctx.db.query.tags.findMany({
      where: (tags, { and, eq }) => and(eq(tags.deckId, deck.id), eq(tags.name, "duplicate tag")),
    });
    expect(tagsWithName).toHaveLength(1);

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "tag.createTag", deckId: deck.id, displayName: "duplicate tag" },
      'Tag "duplicate tag" already exists in this deck.',
    );
  });

  it("should allow same tag name in different decks", async () => {
    await createTestTag(ctx.db, deck.id, "Shared Name");
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Second Deck");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck2.id, name: "Shared Name" });

    expect(result.tagId).toMatch(/^tag_/);

    const secondDeckTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(secondDeckTag).toMatchObject({
      displayName: "Shared Name",
      deckId: deck2.id,
    });
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.createTag({ deckId: nonExistentDeckId, name: "Tag" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should normalize tag name (lowercase, trimmed)", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck.id, name: "  Trimmed Tag  " });

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag).toMatchObject({
      name: "trimmed tag", // Normalized (lowercase, trimmed)
      displayName: "Trimmed Tag", // Schema trims whitespace
    });
  });
});
