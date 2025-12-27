import { orm, schema } from "@repo/db/db";
import type { Deck } from "@repo/db/types";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createSecondTestUser, createTestContext, createTestDeck, createTestTag, type TestContext } from "@/test-utils";

import { deleteTag } from "./delete-tag";

const testRouter = createTRPCRouter({ deleteTag });
const createCaller = createCallerFactory(testRouter);

describe("deleteTag procedure", () => {
  let ctx: TestContext;
  let deck: Deck;

  beforeEach(async () => {
    ctx = await createTestContext();
    deck = await createTestDeck(ctx.db, ctx.userId, "Test Deck");
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should delete a tag that exists in user's deck", async () => {
    const tag = await createTestTag(ctx.db, deck.id, "Test Tag");
    const caller = createCaller(ctx.trpcContext);

    await caller.deleteTag({ id: tag.id });

    const result = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag.id),
    });
    expect(result).toBeUndefined();
  });

  it("should throw NOT_FOUND when tag doesn't exist", async () => {
    // Create a tag first to get a valid format, then delete it from DB
    const tag = await createTestTag(ctx.db, deck.id, "Tag to Delete");
    const tagId = tag.id;
    await ctx.db.delete(schema.tags).where(orm.eq(schema.tags.id, tagId));
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.deleteTag({ id: tagId });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("NOT_FOUND");
      expect((error as TRPCError).message).toBe("Tag not found.");
    }
  });

  it("should not delete a tag in another user's deck (security test)", async () => {
    const otherUser = await createSecondTestUser(ctx.db);
    const otherDeck = await createTestDeck(ctx.db, otherUser.userId, "Other Deck");
    const otherUserTag = await createTestTag(ctx.db, otherDeck.id, "Other User Tag");
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.deleteTag({ id: otherUserTag.id });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("NOT_FOUND");
    }

    const tagStillExists = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, otherUserTag.id),
    });
    expect(tagStillExists).toBeDefined();
    expect(tagStillExists?.id).toBe(otherUserTag.id);

    await otherUser.cleanup();
  });

  it("should log info when tag is deleted successfully", async () => {
    const tag = await createTestTag(ctx.db, deck.id, "Tag to delete");
    const caller = createCaller(ctx.trpcContext);

    await caller.deleteTag({ id: tag.id });

    expect(ctx.mockLogger.info).toHaveBeenCalled();
  });

  it("should log error when tag doesn't exist", async () => {
    // Create a tag first to get a valid format, then delete it from DB
    const tag = await createTestTag(ctx.db, deck.id, "Tag to Delete");
    const tagId = tag.id;
    await ctx.db.delete(schema.tags).where(orm.eq(schema.tags.id, tagId));
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.deleteTag({ id: tagId });
    } catch {
      // Expected to throw
    }

    expect(ctx.mockLogger.error).toHaveBeenCalled();
  });
});
