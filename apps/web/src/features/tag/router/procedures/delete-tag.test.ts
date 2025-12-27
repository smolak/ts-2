import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createSecondTestUser, createTestContext, createTestTag, type TestContext } from "@/test-utils";

import { deleteTag } from "./delete-tag";

const testRouter = createTRPCRouter({ deleteTag });
const createCaller = createCallerFactory(testRouter);

describe("deleteTag procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should delete a tag that exists and belongs to the user", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Test Tag");
    const caller = createCaller(ctx.trpcContext);

    await caller.deleteTag({ id: tag.id });

    const result = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag.id),
    });
    expect(result).toBeUndefined();
  });

  it("should throw BAD_REQUEST when tag doesn't exist", async () => {
    // Create a tag first to get a valid format, then delete it from DB
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag to Delete");
    const tagId = tag.id;
    await ctx.db.delete(schema.tags).where(orm.eq(schema.tags.id, tagId));
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.deleteTag({ id: tagId });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
      expect((error as TRPCError).message).toBe("Tag doesn't exists.");
    }
  });

  it("should not delete a tag belonging to another user (security test)", async () => {
    const otherUser = await createSecondTestUser(ctx.db);
    const otherUserTag = await createTestTag(ctx.db, otherUser.userId, "Other User Tag");
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.deleteTag({ id: otherUserTag.id });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }

    const tagStillExists = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, otherUserTag.id),
    });
    expect(tagStillExists).toBeDefined();
    expect(tagStillExists?.id).toBe(otherUserTag.id);

    await otherUser.cleanup();
  });

  it("should log info when tag is deleted successfully", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag to delete");
    const caller = createCaller(ctx.trpcContext);

    await caller.deleteTag({ id: tag.id });

    expect(ctx.mockLogger.info).toHaveBeenCalled();
  });

  it("should log error when tag doesn't exist", async () => {
    // Create a tag first to get a valid format, then delete it from DB
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag to Delete");
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
