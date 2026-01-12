import { orm, schema } from "@repo/db/db";
import { generateDeckId } from "@repo/db/id/deck-id";
import { generateUserUrlId } from "@repo/db/id/user-url-id";
import type { Deck, UserUrl } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import {
  createTestContext,
  createTestDeck,
  createTestDeckUrl,
  createTestUrl,
  createTestUserUrl,
  createTestUserUrlWithUrl,
  type TestContext,
} from "@/test-utils";

import { addUrlToDeck } from "./add-url-to-deck";

const testRouter = createTRPCRouter({ addUrlToDeck });
const createCaller = createCallerFactory(testRouter);

describe("addUrlToDeck procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  let userUrl: UserUrl;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    userUrl = urlData.userUrl;
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should add a URL to a deck", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.addUrlToDeck({ deckId: deck.id, userUrlId: userUrl.id });

    expect(result).toEqual({
      added: true,
      deckId: deck.id,
      urlsCount: 1,
    });

    const deckUrl = await ctx.db.query.deckUrls.findFirst({
      where: (deckUrls, { and, eq }) => and(eq(deckUrls.deckId, deck.id), eq(deckUrls.userUrlId, userUrl.id)),
    });
    expect(deckUrl).toBeDefined();

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.addUrlToDeck",
        userId: ctx.userId,
        deckId: deck.id,
        userUrlId: userUrl.id,
        urlsCount: 1,
      },
      "URL added to deck.",
    );
  });

  it("should increment urlsCount when adding another URL", async () => {
    const caller = createCaller(ctx.trpcContext);

    await caller.addUrlToDeck({ deckId: deck.id, userUrlId: userUrl.id });

    const deckWithUrl = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(deckWithUrl).toMatchObject({ urlsCount: 1 });

    const urlRecord = await createTestUrl(ctx.db, "https://example.com/test-2");
    const anotherUserUrl = await createTestUserUrl(ctx.db, ctx.userId, urlRecord.id);

    await caller.addUrlToDeck({ deckId: deck.id, userUrlId: anotherUserUrl.id });

    const deckWithAnotherUrl = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(deckWithAnotherUrl).toMatchObject({ urlsCount: 2 });
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.addUrlToDeck({ deckId: nonExistentDeckId, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.addUrlToDeck",
        userId: ctx.userId,
        deckId: nonExistentDeckId,
      },
      "Deck not found, not owned by user, or pending deletion.",
    );
  });

  it("should throw NOT_FOUND when user URL doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentUserUrlId = generateUserUrlId();

    await expect(caller.addUrlToDeck({ deckId: deck.id, userUrlId: nonExistentUserUrlId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "URL not found.",
    });
  });

  it("should throw NOT_FOUND when deck belongs to another user", async () => {
    const secondUser = await ctx.createAdditionalUser();
    const otherDeck = await createTestDeck(ctx.db, secondUser.userId, "Other User Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.addUrlToDeck({ deckId: otherDeck.id, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND when URL belongs to another user", async () => {
    const secondUser = await ctx.createAdditionalUser();
    const otherUrlData = await createTestUserUrlWithUrl(ctx.db, secondUser.userId);
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.addUrlToDeck({ deckId: deck.id, userUrlId: otherUrlData.userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "URL not found.",
    });
  });

  it("should throw BAD_REQUEST when URL is already in deck", async () => {
    await createTestDeckUrl(ctx.db, deck.id, userUrl.id);
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.addUrlToDeck({ deckId: deck.id, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "URL is already in this deck.",
    });
  });

  it("should throw NOT_FOUND when deck is scheduled for deletion", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.addUrlToDeck({ deckId: deck.id, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });
});
