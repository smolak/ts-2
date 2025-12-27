import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createSecondTestUser, createTestContext, createTestTag, type TestContext } from "@/test-utils";

import { updateTag } from "./update-tag";

const testRouter = createTRPCRouter({ updateTag });
const createCaller = createCallerFactory(testRouter);

describe("updateTag procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should update a tag name successfully", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Original Name");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateTag({ id: tag.id, name: "Updated Name" });

    expect(result.name).toBe("Updated Name");
    expect(result.id).toBe(tag.id);

    const updatedTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag.id),
    });
    expect(updatedTag?.name).toBe("Updated Name");
  });

  it("should throw BAD_REQUEST when tag doesn't exist", async () => {
    // Create a tag first to get a valid format, then delete it from DB
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag to Delete");
    const tagId = tag.id;
    await ctx.db.delete(schema.tags).where(orm.eq(schema.tags.id, tagId));
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.updateTag({ id: tagId, name: "New Name" });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }
  });

  it("should not update a tag belonging to another user (security test)", async () => {
    const otherUser = await createSecondTestUser(ctx.db);
    const otherUserTag = await createTestTag(ctx.db, otherUser.userId, "Other User Tag");
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.updateTag({ id: otherUserTag.id, name: "Hacked Name" });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }

    const tagUnchanged = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, otherUserTag.id),
    });
    expect(tagUnchanged?.name).toBe("Other User Tag");

    await otherUser.cleanup();
  });

  it("should throw BAD_REQUEST when new name conflicts with existing tag", async () => {
    await createTestTag(ctx.db, ctx.userId, "Tag One");
    const tag2 = await createTestTag(ctx.db, ctx.userId, "Tag Two");
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.updateTag({ id: tag2.id, name: "Tag One" });
      expect.fail("Expected error to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
      expect((error as TRPCError).message).toBe("Tag name exists. Use different tag name.");
    }

    const tag2Unchanged = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag2.id),
    });
    expect(tag2Unchanged?.name).toBe("Tag Two");
  });

  it("should allow updating to same name (no-op)", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Same Name");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateTag({ id: tag.id, name: "Same Name" });

    expect(result.name).toBe("Same Name");
  });

  it("should allow same name that exists for different user", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "My Tag");
    const otherUser = await createSecondTestUser(ctx.db);
    await createTestTag(ctx.db, otherUser.userId, "Their Tag");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateTag({ id: tag.id, name: "Their Tag" });

    expect(result.name).toBe("Their Tag");

    await otherUser.cleanup();
  });

  it("should preserve urlsCount when updating name", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag With Count");
    await ctx.db.update(schema.tags).set({ urlsCount: 5 }).where(orm.eq(schema.tags.id, tag.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateTag({ id: tag.id, name: "Updated Tag" });

    expect(result.urlsCount).toBe(5);
  });

  it("should log info when tag is updated successfully", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag to Update");
    const caller = createCaller(ctx.trpcContext);

    await caller.updateTag({ id: tag.id, name: "Updated" });

    expect(ctx.mockLogger.info).toHaveBeenCalled();
  });

  it("should log error when tag doesn't exist", async () => {
    // Create a tag first to get a valid format, then delete it from DB
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag to Delete");
    const tagId = tag.id;
    await ctx.db.delete(schema.tags).where(orm.eq(schema.tags.id, tagId));
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.updateTag({ id: tagId, name: "New Name" });
    } catch {
      // Expected to throw
    }

    expect(ctx.mockLogger.error).toHaveBeenCalled();
  });

  it("should trim whitespace from updated name", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Original");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateTag({ id: tag.id, name: "  Trimmed  " });

    expect(result.name).toBe("Trimmed");
  });
});
