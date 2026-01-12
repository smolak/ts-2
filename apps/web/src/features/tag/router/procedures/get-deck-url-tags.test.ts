import { generateDeckId } from "@repo/db/id/deck-id";
import { generateUserUrlId } from "@repo/db/id/user-url-id";
import type { Deck, Tag, UserUrl } from "@repo/db/types";
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

import { getDeckUrlTags } from "./get-deck-url-tags";

const testRouter = createTRPCRouter({ getDeckUrlTags });
const createCaller = createCallerFactory(testRouter);

describe("getDeckUrlTags procedure", () => {
  let ctx: TestContext;
  let deck: Deck;
  let userUrl: UserUrl;
  let tag1: Tag;
  let tag2: Tag;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
    const urlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    userUrl = urlData.userUrl;
    await createTestDeckUrl(ctx.db, deck.id, userUrl.id);
    tag1 = await createTestTag(ctx.db, deck.id, "Tag One");
    tag2 = await createTestTag(ctx.db, deck.id, "Tag Two");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return tags for a deck URL", async () => {
    await createTestDeckUrlTag(ctx.db, deck.id, userUrl.id, tag1.id, 0);
    await createTestDeckUrlTag(ctx.db, deck.id, userUrl.id, tag2.id, 1);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrlTags({ deckId: deck.id, userUrlId: userUrl.id });

    expect(result).toHaveLength(2);
    expect(result[0]?.displayName).toBe("Tag One");
    expect(result[1]?.displayName).toBe("Tag Two");
  });

  it("should return empty array when deck URL has no tags", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrlTags({ deckId: deck.id, userUrlId: userUrl.id });

    expect(result).toHaveLength(0);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "tag.getDeckUrlTags", deckId: deck.id, userUrlId: userUrl.id },
      "Fetching deck URL tags.",
    );
  });

  it("should return empty array when deck-URL association doesn't exist", async () => {
    const nonExistentUserUrlId = generateUserUrlId();
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrlTags({ deckId: deck.id, userUrlId: nonExistentUserUrlId });

    expect(result).toHaveLength(0);
  });

  it("should return empty array for non-existent deck", async () => {
    const nonExistentDeckId = generateDeckId();
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrlTags({ deckId: nonExistentDeckId, userUrlId: userUrl.id });

    expect(result).toHaveLength(0);
  });

  it("should return tags in order by tagOrder", async () => {
    // Add tags in reverse order (tag2 first, then tag1)
    await createTestDeckUrlTag(ctx.db, deck.id, userUrl.id, tag2.id, 0);
    await createTestDeckUrlTag(ctx.db, deck.id, userUrl.id, tag1.id, 1);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getDeckUrlTags({ deckId: deck.id, userUrlId: userUrl.id });

    expect(result[0]?.displayName).toBe("Tag Two");
    expect(result[1]?.displayName).toBe("Tag One");
  });
});
