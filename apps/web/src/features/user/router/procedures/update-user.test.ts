import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, type TestContext } from "@/test-utils";

import { updateUser } from "./update-user";

const testRouter = createTRPCRouter({ updateUser });
const createCaller = createCallerFactory(testRouter);

describe("updateUser procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should update user apiKey", async () => {
    const newApiKey = generateApiKey();
    const caller = createCaller(ctx.trpcContext);

    await caller.updateUser({ apiKey: newApiKey });

    const updatedUser = await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.userId),
    });
    expect(updatedUser?.apiKey).toBe(newApiKey);

    // Verify logging
    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "user.updateUser" },
      "Updating user initiated.",
    );
    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "user.updateUser" },
      "User profile update complete.",
    );
  });

  it("should fail when apiKey has wrong length", async () => {
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.updateUser({ apiKey: "tooshort" })).rejects.toThrow();
  });

  it("should fail when apiKey has invalid characters", async () => {
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.updateUser({ apiKey: "!@#$%^&*()".repeat(3) })).rejects.toThrow();
  });
});
