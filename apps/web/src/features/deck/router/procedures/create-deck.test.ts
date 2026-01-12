import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { createDeck } from "./create-deck";

const testRouter = createTRPCRouter({ createDeck });
const createCaller = createCallerFactory(testRouter);

describe("createDeck procedure", () => {
  let ctx: TestContext;
  const additionalTestContexts: TestContext[] = [];

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    for (const testCtx of additionalTestContexts) {
      await testCtx.cleanup();
    }
    additionalTestContexts.length = 0;
    await ctx.cleanup();
  });

  it("should create a public deck with valid input", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createDeck({
      name: "My Test Deck",
      slug: "my-test-deck",
      isPublic: true,
    });

    expect(result).toEqual({
      deckId: expect.stringMatching(/^deck_/),
      slug: "my-test-deck",
    });

    const createdDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, result.deckId),
    });
    expect(createdDeck).toMatchObject({
      name: "My Test Deck",
      slug: "my-test-deck",
      isPublic: true,
      urlsCount: 0,
      followersCount: 0,
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.createDeck",
        userId: ctx.userId,
        deckId: result.deckId,
        name: "My Test Deck",
        slug: "my-test-deck",
      },
      "Deck created.",
    );
  });

  it("should create a private deck with valid input", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createDeck({
      name: "Private Deck",
      slug: "private-deck",
      isPublic: false,
    });

    const createdDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, result.deckId),
    });
    expect(createdDeck).toMatchObject({
      isPublic: false,
    });
  });

  it("should create a deck with metadata", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createDeck({
      name: "Deck With Metadata",
      slug: "deck-with-metadata",
      isPublic: true,
      metadata: {
        description: "A great deck",
        color: "#FF5733",
      },
    });

    const createdDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, result.deckId),
    });
    expect(createdDeck).toMatchObject({
      metadata: {
        description: "A great deck",
        color: "#FF5733",
      },
    });
  });

  it("should throw BAD_REQUEST when slug already exists for user", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Existing Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.createDeck({
        name: "Another Deck",
        slug: "existing-deck",
        isPublic: true,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Deck with this slug already exists.",
    });

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.createDeck", userId: ctx.userId, slug: "existing-deck" },
      "Deck with this slug already exists.",
    );
  });

  it("should allow same slug for different users", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Existing Deck");

    const secondCtx = await createTestContext();
    additionalTestContexts.push(secondCtx);
    const secondCaller = createCaller(secondCtx.trpcContext);

    const result = await secondCaller.createDeck({
      name: "Same Slug Deck",
      slug: "existing-deck",
      isPublic: true,
    });

    expect(result).toEqual({
      deckId: expect.stringMatching(/^deck_/),
      slug: "existing-deck",
    });
  });
});
