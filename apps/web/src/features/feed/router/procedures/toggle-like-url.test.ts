import { orm, schema } from "@repo/db/db";
import { generateUserUrlId } from "@repo/db/id/user-url-id";
import type { UserUrl } from "@repo/db/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import {
  type AdditionalTestUser,
  createTestContext,
  createTestUserProfile,
  createTestUserUrlWithUrl,
  ensureLikedInteractionType,
  type TestContext,
} from "@/test-utils";

import { toggleLikeUrl } from "./toggle-like-url";

const testRouter = createTRPCRouter({ toggleLikeUrl });
const createCaller = createCallerFactory(testRouter);

describe("toggleLikeUrl procedure", () => {
  let ctx: TestContext;
  let secondUser: AdditionalTestUser;
  let otherUserUrl: UserUrl;

  beforeEach(async () => {
    ctx = await createTestContext();
    await ensureLikedInteractionType(ctx.db);
    await createTestUserProfile(ctx.db, ctx.userId, `testuser_${Date.now()}`);

    // Create a second user with a URL to like
    secondUser = await ctx.createAdditionalUser();
    await createTestUserProfile(ctx.db, secondUser.userId, `otheruser_${Date.now()}`);
    const urlData = await createTestUserUrlWithUrl(ctx.db, secondUser.userId);
    otherUserUrl = urlData.userUrl;
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should like a URL", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.toggleLikeUrl({ userUrlId: otherUserUrl.id });

    expect(result).toEqual({
      status: "liked",
      userUrlId: otherUserUrl.id,
      likesCount: 1,
    });

    // Verify interaction was created
    const interaction = await ctx.db.query.usersUrlsInteractions.findFirst({
      where: (i, { and, eq }) =>
        and(eq(i.userUrlId, otherUserUrl.id), eq(i.userId, ctx.userId), eq(i.interactionTypeId, 1)),
    });
    expect(interaction).toBeDefined();

    // Verify likesCount was incremented on the URL
    const updatedUrl = await ctx.db.query.usersUrls.findFirst({
      where: (u, { eq }) => eq(u.id, otherUserUrl.id),
    });
    expect(updatedUrl).toMatchObject({ likesCount: 1 });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "likeUrl.toggleLikeUrl",
        userId: ctx.userId,
        userUrlId: otherUserUrl.id,
      },
      "Liked the URL.",
    );
  });

  it("should unlike a previously liked URL", async () => {
    // First, like the URL
    await ctx.db.insert(schema.usersUrlsInteractions).values({
      userUrlId: otherUserUrl.id,
      userId: ctx.userId,
      interactionTypeId: 1,
    });
    await ctx.db.update(schema.usersUrls).set({ likesCount: 1 }).where(orm.eq(schema.usersUrls.id, otherUserUrl.id));

    const caller = createCaller(ctx.trpcContext);

    const result = await caller.toggleLikeUrl({ userUrlId: otherUserUrl.id });

    expect(result).toEqual({
      status: "unliked",
      userUrlId: otherUserUrl.id,
      likesCount: 0,
    });

    // Verify interaction was deleted
    const interaction = await ctx.db.query.usersUrlsInteractions.findFirst({
      where: (i, { and, eq }) =>
        and(eq(i.userUrlId, otherUserUrl.id), eq(i.userId, ctx.userId), eq(i.interactionTypeId, 1)),
    });
    expect(interaction).toBeUndefined();

    // Verify likesCount was decremented on the URL
    const updatedUrl = await ctx.db.query.usersUrls.findFirst({
      where: (u, { eq }) => eq(u.id, otherUserUrl.id),
    });
    expect(updatedUrl).toMatchObject({ likesCount: 0 });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      {
        requestId: ctx.trpcContext.requestId,
        path: "likeUrl.toggleLikeUrl",
        userId: ctx.userId,
        userUrlId: otherUserUrl.id,
      },
      "Unliked the URL.",
    );
  });

  it("should throw NOT_FOUND when URL doesn't exist", async () => {
    const caller = createCaller(ctx.trpcContext);
    const nonExistentUserUrlId = generateUserUrlId();

    await expect(caller.toggleLikeUrl({ userUrlId: nonExistentUserUrlId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "User URL not found.",
    });
  });

  it("should throw BAD_REQUEST when trying to like own URL", async () => {
    const myUrlData = await createTestUserUrlWithUrl(ctx.db, ctx.userId);
    const caller = createCaller(ctx.trpcContext);

    await expect(caller.toggleLikeUrl({ userUrlId: myUrlData.userUrl.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "You cannot like your own URL.",
    });
  });
});
