import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { updateDeck } from "./update-deck";

const testRouter = createTRPCRouter({ updateDeck });
const createCaller = createCallerFactory(testRouter);

describe("updateDeck procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should update deck name", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeck({
      deckId: deck.id,
      name: "Updated Name",
    });

    expect(result.name).toBe("Updated Name");

    const updatedDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(updatedDeck?.name).toBe("Updated Name");

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.updateDeck", userId: ctx.userId, deckId: deck.id },
      "Deck updated.",
    );
  });

  it("should update deck slug", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeck({
      deckId: deck.id,
      slug: "new-slug",
    });

    expect(result.slug).toBe("new-slug");
  });

  it("should update deck visibility", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeck({
      deckId: deck.id,
      isPublic: true,
    });

    expect(result.isPublic).toBe(true);

    const updatedDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(updatedDeck?.isPublic).toBe(true);
  });

  it("should update deck metadata", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeck({
      deckId: deck.id,
      metadata: {
        description: "New description",
        color: "#123456",
      },
    });

    expect(result.metadata).toEqual({
      description: "New description",
      color: "#123456",
    });
  });

  it("should update multiple fields at once", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeck({
      deckId: deck.id,
      name: "Multi Update",
      slug: "multi-update",
      isPublic: true,
      metadata: { description: "Multi" },
    });

    expect(result.name).toBe("Multi Update");
    expect(result.slug).toBe("multi-update");
    expect(result.isPublic).toBe(true);
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(
      caller.updateDeck({
        deckId: nonExistentDeckId,
        name: "Updated",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND when deck belongs to another user", async () => {
    const otherUser = await ctx.createAdditionalUser();
    const otherDeck = await createTestDeck(ctx.db, otherUser.userId, "Other Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.updateDeck({
        deckId: otherDeck.id,
        name: "Hacked",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw BAD_REQUEST when updating a deck scheduled for deletion", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.updateDeck({
        deckId: deck.id,
        name: "Should Fail",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot update a deck scheduled for deletion. Restore it first.",
    });
  });

  it("should throw BAD_REQUEST when slug already exists for user", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Another Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.updateDeck({
        deckId: deck.id,
        slug: "another-deck",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Deck with this slug already exists.",
    });
  });

  it("should allow updating to the same slug", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeck({
      deckId: deck.id,
      slug: deck.slug,
    });

    expect(result.slug).toBe(deck.slug);
  });
});
