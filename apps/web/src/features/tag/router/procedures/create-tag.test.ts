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

  it("should create a tag with valid name in deck", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck.id, name: "My New Tag" });

    expect(result).toHaveProperty("tagId");
    expect(result.tagId).toMatch(/^tag_/);
    expect(result).toHaveProperty("displayName", "My New Tag");
    expect(result).toHaveProperty("name", "my new tag"); // Normalized

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag).toBeDefined();
    expect(createdTag?.name).toBe("my new tag"); // Normalized
    expect(createdTag?.displayName).toBe("My New Tag");
    expect(createdTag?.deckId).toBe(deck.id);
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
  });

  it("should allow same tag name in different decks", async () => {
    await createTestTag(ctx.db, deck.id, "Shared Name");
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Second Deck");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck2.id, name: "Shared Name" });

    expect(result).toHaveProperty("tagId");

    const secondDeckTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(secondDeckTag?.displayName).toBe("Shared Name");
    expect(secondDeckTag?.deckId).toBe(deck2.id);
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    // Use a valid format deck ID that doesn't exist (27 chars total: deck_ + 22 chars)
    const nonExistentDeckId = "deck_abcdefghijklmnopqrstuv" as Deck["id"];

    await expect(caller.createTag({ deckId: nonExistentDeckId, name: "Tag" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should set urlsCount to 0 for new tag", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck.id, name: "New Tag" });

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag?.urlsCount).toBe(0);
  });

  it("should log info when tag is created successfully", async () => {
    const caller = createCaller(ctx.trpcContext);

    await caller.createTag({ deckId: deck.id, name: "Logged Tag" });

    expect(ctx.mockLogger.info).toHaveBeenCalled();
  });

  it("should log error when tag name already exists", async () => {
    await createTestTag(ctx.db, deck.id, "Existing Tag");
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.createTag({ deckId: deck.id, name: "Existing Tag" });
    } catch {
      // Expected to throw
    }

    expect(ctx.mockLogger.error).toHaveBeenCalled();
  });

  it("should normalize tag name (lowercase, trimmed)", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ deckId: deck.id, name: "  Trimmed Tag  " });

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag?.name).toBe("trimmed tag"); // Normalized (lowercase, trimmed)
    expect(createdTag?.displayName).toBe("Trimmed Tag"); // Schema trims whitespace
  });
});
