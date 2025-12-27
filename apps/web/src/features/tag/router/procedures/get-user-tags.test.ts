import { orm, schema } from "@repo/db/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createSecondTestUser, createTestContext, createTestTag, type TestContext } from "@/test-utils";

import { getUserTags } from "./get-user-tags";

const testRouter = createTRPCRouter({ getUserTags });
const createCaller = createCallerFactory(testRouter);

describe("getUserTags procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return empty array when user has no tags", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserTags();

    expect(result).toEqual([]);
  });

  it("should return all tags belonging to the user", async () => {
    await createTestTag(ctx.db, ctx.userId, "Tag A");
    await createTestTag(ctx.db, ctx.userId, "Tag B");
    await createTestTag(ctx.db, ctx.userId, "Tag C");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserTags();

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.name)).toContain("Tag A");
    expect(result.map((t) => t.name)).toContain("Tag B");
    expect(result.map((t) => t.name)).toContain("Tag C");
  });

  it("should return tags sorted by name alphabetically", async () => {
    await createTestTag(ctx.db, ctx.userId, "Zebra");
    await createTestTag(ctx.db, ctx.userId, "Apple");
    await createTestTag(ctx.db, ctx.userId, "Mango");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserTags();

    expect(result[0]?.name).toBe("Apple");
    expect(result[1]?.name).toBe("Mango");
    expect(result[2]?.name).toBe("Zebra");
  });

  it("should not return tags belonging to other users", async () => {
    await createTestTag(ctx.db, ctx.userId, "My Tag");
    const otherUser = await createSecondTestUser(ctx.db);
    await createTestTag(ctx.db, otherUser.userId, "Other Tag");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserTags();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("My Tag");

    await otherUser.cleanup();
  });

  it("should include urlsCount in returned tags", async () => {
    const tag = await createTestTag(ctx.db, ctx.userId, "Tag With Count");
    await ctx.db.update(schema.tags).set({ urlsCount: 10 }).where(orm.eq(schema.tags.id, tag.id));
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserTags();

    expect(result[0]?.urlsCount).toBe(10);
  });

  it("should return correct DTO shape with id, name, urlsCount", async () => {
    await createTestTag(ctx.db, ctx.userId, "Complete Tag");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getUserTags();

    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("urlsCount");
    expect(result[0]?.id).toMatch(/^tag_/);
    expect(result[0]?.name).toBe("Complete Tag");
    expect(typeof result[0]?.urlsCount).toBe("number");
  });

  it("should log info when fetching tags", async () => {
    const caller = createCaller(ctx.trpcContext);

    await caller.getUserTags();

    expect(ctx.mockLogger.info).toHaveBeenCalled();
  });
});
