import { generateDeckId } from "@repo/db/id/deck-id";
import type { Deck, UserUrl } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import {
  createTestContext,
  createTestDeck,
  createTestDeckUrl,
  createTestDeckUrlTag,
  createTestTag,
  createTestUserUrlWithUrl,
  type TestContext,
} from "@/test-utils";

import { updateDeckUrlTags } from "./update-user-url";

const testRouter = createTRPCRouter({ updateDeckUrlTags });
const createCaller = createCallerFactory(testRouter);

describe("updateDeckUrlTags procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  let userUrl: UserUrl;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    ({ userUrl } = await createTestUserUrlWithUrl(ctx.db, ctx.userId));
    await createTestDeckUrl(ctx.db, deck.id, userUrl.id);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should add tags to a deck URL", async () => {
    const tag1 = await createTestTag(ctx.db, deck.id, "Tag 1");
    const tag2 = await createTestTag(ctx.db, deck.id, "Tag 2");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeckUrlTags({
      deckId: deck.id,
      userUrlId: userUrl.id,
      tagIds: [tag1.id, tag2.id],
    });

    expect(result.success).toBe(true);

    const deckUrlTags = await ctx.db.query.deckUrlsTags.findMany({
      where: (dut, { and, eq }) => and(eq(dut.deckId, deck.id), eq(dut.userUrlId, userUrl.id)),
    });
    expect(deckUrlTags).toHaveLength(2);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "deckUrl.updateDeckUrlTags",
        deckId: deck.id,
        userUrlId: userUrl.id,
      },
      "Deck URL tags updated.",
    );
  });

  it("should remove tags from a deck URL", async () => {
    const tag = await createTestTag(ctx.db, deck.id, "Tag to Remove");
    await createTestDeckUrlTag(ctx.db, deck.id, userUrl.id, tag.id, 1);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateDeckUrlTags({
      deckId: deck.id,
      userUrlId: userUrl.id,
      tagIds: [],
    });

    expect(result.success).toBe(true);

    const deckUrlTags = await ctx.db.query.deckUrlsTags.findMany({
      where: (dut, { and, eq }) => and(eq(dut.deckId, deck.id), eq(dut.userUrlId, userUrl.id)),
    });
    expect(deckUrlTags).toHaveLength(0);
  });

  it("should throw NOT_FOUND when deck doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentDeckId = generateDeckId();

    await expect(
      caller.updateDeckUrlTags({
        deckId: nonExistentDeckId,
        userUrlId: userUrl.id,
        tagIds: [],
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
      caller.updateDeckUrlTags({
        deckId: otherDeck.id,
        userUrlId: userUrl.id,
        tagIds: [],
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  });

  it("should throw NOT_FOUND when URL is not in deck", async () => {
    const { userUrl: unlinkedUrl } = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.updateDeckUrlTags({
        deckId: deck.id,
        userUrlId: unlinkedUrl.id,
        tagIds: [],
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "URL not found in this deck.",
    });
  });

  it("should throw BAD_REQUEST when tags don't belong to the deck", async () => {
    const deck2 = await createTestDeck(ctx.db, ctx.userId, "Other Deck");
    const otherDeckTag = await createTestTag(ctx.db, deck2.id, "Other Deck Tag");
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.updateDeckUrlTags({
        deckId: deck.id,
        userUrlId: userUrl.id,
        tagIds: [otherDeckTag.id],
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Some tags don't belong to this deck.",
    });
  });

  it("should update tag urlsCount when adding and removing tags", async () => {
    const tag1 = await createTestTag(ctx.db, deck.id, "Tag 1");
    const tag2 = await createTestTag(ctx.db, deck.id, "Tag 2");
    const caller = createCaller(ctx.trpcContext);

    // Add tags
    await caller.updateDeckUrlTags({
      deckId: deck.id,
      userUrlId: userUrl.id,
      tagIds: [tag1.id, tag2.id],
    });

    let updatedTag1 = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag1.id),
    });
    expect(updatedTag1?.urlsCount).toBe(1);

    // Remove tag1, keep tag2
    await caller.updateDeckUrlTags({
      deckId: deck.id,
      userUrlId: userUrl.id,
      tagIds: [tag2.id],
    });

    updatedTag1 = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag1.id),
    });
    expect(updatedTag1?.urlsCount).toBe(0);
  });
});
