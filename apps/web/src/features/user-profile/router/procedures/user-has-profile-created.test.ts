import { orm, schema } from "@repo/db/db";
import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestUserProfile, type TestContext } from "@/test-utils";
import { userHasProfileCreated } from "./user-has-profile-created";

const testRouter = createTRPCRouter({ userHasProfileCreated });
const createCaller = createCallerFactory(testRouter);

describe("userHasProfileCreated procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return false when user has no profile", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.userHasProfileCreated();

    expect(result).toBe(false);
  });

  it("should return true when user has complete profile with username and apiKey", async () => {
    const testApiKey = generateApiKey();
    await ctx.db.update(schema.users).set({ apiKey: testApiKey }).where(orm.eq(schema.users.id, ctx.userId));
    await createTestUserProfile(ctx.db, ctx.userId, "testuser1");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.userHasProfileCreated();

    expect(result).toBe(true);
    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "userProfile.userHasProfileCreated", userId: ctx.userId },
      "Check if user has profile created.",
    );
  });

  it("should return false when user profile exists but apiKey is missing", async () => {
    await createTestUserProfile(ctx.db, ctx.userId, "testuser2");
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.userHasProfileCreated();

    expect(result).toBe(false);
  });
});
