import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestUserProfile, type TestContext } from "@/test-utils";

import { getPublicUserProfile } from "./get-public-user-profile";

const testRouter = createTRPCRouter({ getPublicUserProfile });
const createCaller = createCallerFactory(testRouter);

describe("getPublicUserProfile procedure", () => {
  let ctx: TestContext;
  const testUsername = "testuser1";
  const testImageUrl = "https://example.com/avatar.png";

  beforeEach(async () => {
    ctx = await createTestContext();
    await createTestUserProfile(ctx.db, ctx.userId, testUsername, testImageUrl);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return public user profile by username", async () => {
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicUserProfile({ username: testUsername });

    expect(result).toMatchObject({
      username: testUsername,
      id: ctx.userId,
      followingCount: expect.any(Number),
      followersCount: expect.any(Number),
      likesCount: expect.any(Number),
      urlsCount: expect.any(Number),
      imageUrl: testImageUrl,
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.unauthTrpcContext.requestId, path: "userProfile.getPublicUserProfile", username: testUsername },
      "Get public user profile initiated.",
    );
  });

  it("should return null for non-existent username", async () => {
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicUserProfile({ username: "nonexist" });

    expect(result).toBeNull();
  });

  it("should be case-insensitive when looking up username", async () => {
    const caller = createCaller(ctx.unauthTrpcContext);

    const result = await caller.getPublicUserProfile({ username: "TESTUSER1" });

    expect(result).toMatchObject({ username: testUsername });
  });

  it("should return profile for another user", async () => {
    const secondUser = await ctx.createAdditionalUser();
    const otherUsername = "other123";
    await createTestUserProfile(ctx.db, secondUser.userId, otherUsername);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPublicUserProfile({ username: otherUsername });

    expect(result).toMatchObject({
      username: otherUsername,
      id: secondUser.userId,
    });
  });
});
