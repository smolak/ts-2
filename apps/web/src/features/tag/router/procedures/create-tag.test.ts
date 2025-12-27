import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestTag, type TestContext } from "@/test-utils";

import { createTag } from "./create-tag";

const testRouter = createTRPCRouter({ createTag });
const createCaller = createCallerFactory(testRouter);

describe("createTag procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should create a tag with valid name", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ name: "My New Tag" });

    expect(result).toHaveProperty("tagId");
    expect(result.tagId).toMatch(/^tag_/);

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag).toBeDefined();
    expect(createdTag?.name).toBe("My New Tag");
    expect(createdTag?.userId).toBe(ctx.userId);
  });

  it("should throw BAD_REQUEST when tag name already exists for user", async () => {
    const existingTag = await createTestTag(ctx.db, ctx.userId, "Duplicate Tag");
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.createTag({ name: "Duplicate Tag" })).rejects.toThrow(TRPCError);
    await expect(caller.createTag({ name: "Duplicate Tag" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Tag name exists. Use different tag name.",
    });

    const tagsWithName = await ctx.db.query.tags.findMany({
      where: (tags, { and, eq }) => and(eq(tags.userId, ctx.userId), eq(tags.name, "Duplicate Tag")),
    });
    expect(tagsWithName).toHaveLength(1);
    expect(tagsWithName[0]?.id).toBe(existingTag.id);
  });

  it("should allow same tag name for different users", async () => {
    const existingTag = await createTestTag(ctx.db, ctx.userId, "Shared Name");
    const secondUserCtx = await createTestContext();
    const secondCaller = createCaller(secondUserCtx.trpcContext);

    const result = await secondCaller.createTag({ name: "Shared Name" });

    expect(result).toHaveProperty("tagId");
    expect(result.tagId).not.toBe(existingTag.id);

    const secondUserTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(secondUserTag?.name).toBe("Shared Name");
    expect(secondUserTag?.userId).toBe(secondUserCtx.userId);

    await secondUserCtx.cleanup();
  });

  it("should set urlsCount to 0 for new tag", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ name: "New Tag" });

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag?.urlsCount).toBe(0);
  });

  it("should log info when tag is created successfully", async () => {
    const caller = createCaller(ctx.trpcContext);

    await caller.createTag({ name: "Logged Tag" });

    expect(ctx.mockLogger.info).toHaveBeenCalled();
  });

  it("should log error when tag name already exists", async () => {
    await createTestTag(ctx.db, ctx.userId, "Existing Tag");
    const caller = createCaller(ctx.trpcContext);

    try {
      await caller.createTag({ name: "Existing Tag" });
    } catch {
      // Expected to throw
    }

    expect(ctx.mockLogger.error).toHaveBeenCalled();
  });

  it("should trim whitespace from tag name", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createTag({ name: "  Trimmed Tag  " });

    const createdTag = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, result.tagId),
    });
    expect(createdTag?.name).toBe("Trimmed Tag");
  });
});
