import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, type TestContext } from "@/test-utils";

import { updateUserProfile } from "./update-user-profile";

const testRouter = createTRPCRouter({ updateUserProfile });
const createCaller = createCallerFactory(testRouter);

describe("updateUserProfile procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should update user API key", async () => {
    const apiKey = generateApiKey();
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.updateUserProfile({ apiKey });

    expect(result).toBe(true);

    // Verify the update in database
    const user = await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.userId),
      columns: { apiKey: true },
    });
    expect(user).toMatchObject({ apiKey });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "userProfile.updateUserProfile" },
      "User profile update complete.",
    );
  });

  it("should validate API key format - rejects short keys", async () => {
    const caller = createCaller(ctx.trpcContext);

    // Short API key should fail validation
    await expect(caller.updateUserProfile({ apiKey: "short" })).rejects.toThrow();
  });

  it("should validate API key format - rejects empty keys", async () => {
    const caller = createCaller(ctx.trpcContext);

    // Empty API key should fail validation
    await expect(caller.updateUserProfile({ apiKey: "" })).rejects.toThrow();
  });
});
