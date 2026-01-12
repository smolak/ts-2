import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestUserProfile, type TestContext } from "@/test-utils";

import { usernameCheck } from "./username-check";

const testRouter = createTRPCRouter({ usernameCheck });
const createCaller = createCallerFactory(testRouter);

describe("usernameCheck procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return usernameAvailable true when username is not taken", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.usernameCheck({ username: "unique123" });

    expect(result.usernameAvailable).toBe(true);

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "userProfileData.usernameCheck", username: "unique123" },
      "Checking username availability.",
    );
  });

  it("should be case-insensitive when checking usernames", async () => {
    const existingUsername = "TestUser1";
    await createTestUserProfile(ctx.db, ctx.userId, existingUsername);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.usernameCheck({ username: "testuser1" });

    expect(result.usernameAvailable).toBe(false);
  });

  it("should return usernameAvailable false for username taken by another user", async () => {
    const secondUser = await ctx.createAdditionalUser();
    const existingUsername = "other123";
    await createTestUserProfile(ctx.db, secondUser.userId, existingUsername);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.usernameCheck({ username: existingUsername });

    expect(result.usernameAvailable).toBe(false);
  });

  it("should validate username format", async () => {
    const caller = createCaller(ctx.trpcContext);

    // Empty username should fail validation
    await expect(caller.usernameCheck({ username: "" })).rejects.toThrow();
  });
});
