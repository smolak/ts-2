import { orm, schema } from "@repo/db/db";
import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestUserProfile, type TestContext } from "@/test-utils";
import { getPrivateUserProfile } from "./get-private-user-profile";

const testRouter = createTRPCRouter({ getPrivateUserProfile });
const createCaller = createCallerFactory(testRouter);

describe("getPrivateUserProfile procedure", () => {
  let ctx: TestContext;
  const testUsername = "testuser1";

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return private user profile for authenticated user with profile", async () => {
    const testApiKey = generateApiKey();
    const testImageUrl = "https://example.com/avatar.png";
    await ctx.db.update(schema.users).set({ apiKey: testApiKey }).where(orm.eq(schema.users.id, ctx.userId));
    await createTestUserProfile(ctx.db, ctx.userId, testUsername, testImageUrl);
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPrivateUserProfile();

    expect(result).toMatchObject({
      id: ctx.userId,
      username: testUsername,
      imageUrl: testImageUrl,
      followingCount: 0,
      followersCount: 0,
      likesCount: 0,
      urlsCount: 0,
      apiKey: testApiKey,
      plan: expect.any(String),
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "userProfile.getPrivateUserProfile", userId: ctx.userId },
      "Get private user profile initiated.",
    );
  });

  it("should return undefined for user without profile", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.getPrivateUserProfile();

    expect(result).toBeUndefined();
  });
});
