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

import { removeUrlFromDeck } from "./remove-url-from-deck";

const testRouter = createTRPCRouter({ removeUrlFromDeck });
const createCaller = createCallerFactory(testRouter);

describe("removeUrlFromDeck procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  let userUrl: UserUrl;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    userUrl = urlData.userUrl;
    await createTestDeckUrl(ctx.db, deck.id, userUrl.id);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should remove a URL from a deck", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.removeUrlFromDeck({ deckId: deck.id, userUrlId: userUrl.id });

    expect(result).toEqual({
      removed: true,
      urlsCount: 0,
    });

    const deckUrl = await ctx.db.query.deckUrls.findFirst({
      where: (deckUrls, { and, eq }) => and(eq(deckUrls.deckId, deck.id), eq(deckUrls.userUrlId, userUrl.id)),
    });
    expect(deckUrl).toBeUndefined();

    // Verify urlsCount was decremented in DB
    const updatedDeck = await ctx.db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, deck.id),
    });
    expect(updatedDeck).toMatchObject({ urlsCount: 0 });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.removeUrlFromDeck",
        userId: ctx.userId,
        deckId: deck.id,
        userUrlId: userUrl.id,
        urlsCount: 0,
      },
      "URL removed from deck.",
    );
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(caller.removeUrlFromDeck({ deckId: nonExistentDeckId, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });

    expect(ctx.mockLogger.error).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deck.removeUrlFromDeck",
        userId: ctx.userId,
        deckId: nonExistentDeckId,
      },
      "Deck not found, not owned by user, or pending deletion.",
    );
  });

  it("should throw BAD_REQUEST when URL is not in deck", async () => {
    const urlData2 = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.removeUrlFromDeck({ deckId: deck.id, userUrlId: urlData2.userUrl.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "URL is not in this deck.",
    });
  });

  it("should throw NOT_FOUND when deck belongs to another user", async () => {
    const secondUser = await ctx.createAdditionalUser();
    const otherDeck = await createTestDeck(ctx.db, secondUser.userId, "Other User Deck");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.removeUrlFromDeck({ deckId: otherDeck.id, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND when deck is scheduled for deletion", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.removeUrlFromDeck({ deckId: deck.id, userUrlId: userUrl.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });
});
