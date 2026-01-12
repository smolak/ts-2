import { orm, schema } from "@repo/db/db";
import type { Deck, UserUrl } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import {
  createTestContext,
  createTestDeck,
  createTestDeckUrl,
  createTestUserUrl,
  createTestUserUrlWithUrl,
  type TestContext,
} from "@/test-utils";

import { getUrlDecks } from "./get-url-decks";

const testRouter = createTRPCRouter({ getUrlDecks });
const createCaller = createCallerFactory(testRouter);

describe("getUrlDecks procedure", () => {
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

  it("should return decks containing the URL", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUrlDecks({ userUrlId: userUrl.id });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: deck.id,
      name: "Test Deck",
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "deck.getUrlDecks", userId: ctx.userId, userUrlId: userUrl.id },
      "Fetching decks for URL.",
    );
  });

  it("should return multiple decks when URL is in multiple decks", async () => {
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Second Deck");
    await createTestDeckUrl(ctx.db, deck2.id, userUrl.id);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUrlDecks({ userUrlId: userUrl.id });

    expect(result).toHaveLength(2);
    const deckIds = result.map((d) => d.id);
    expect(deckIds).toContain(deck.id);
    expect(deckIds).toContain(deck2.id);
  });

  it("should return empty array when URL is not in any deck", async () => {
    const urlData2 = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUrlDecks({ userUrlId: urlData2.userUrl.id });

    expect(result).toHaveLength(0);
  });

  it("should not return decks owned by other users", async () => {
    // Get the underlying URL that was created in beforeEach
    const urlRecord = await ctx.db.query.usersUrls.findFirst({
      where: (usersUrls, { eq }) => eq(usersUrls.id, userUrl.id),
      with: { url: true },
    });
    if (!urlRecord) throw new Error("Test setup failed: userUrl not found");

    // Second user creates their own userUrl pointing to the SAME underlying URL
    const secondUser = await ctx.createAdditionalUser();
    const otherUserUrl = await createTestUserUrl(ctx.db, secondUser.userId, urlRecord.url.id);
    const otherDeck = await createTestDeck(ctx.db, secondUser.userId, "Other User Deck");
    await createTestDeckUrl(ctx.db, otherDeck.id, otherUserUrl.id);

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUrlDecks({ userUrlId: userUrl.id });

    // Should only return the user's own deck
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: deck.id });
  });

  it("should return 0 decks when the only deck containing URL is scheduled for deletion", async () => {
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, deck.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUrlDecks({ userUrlId: userUrl.id });

    expect(result).toHaveLength(0);
  });
});
