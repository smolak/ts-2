import { TRPCError } from "@trpc/server";
import { userIdSchema } from "@workspace/user/id/user-id.schema";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

export const isFollowingUserSchema = z.object({
  userId: userIdSchema,
});

export const isFollowingUser = protectedProcedure
  .input(isFollowingUserSchema)
  .query(async ({ input: { userId: followingId }, ctx: { logger, requestId, user, db } }) => {
    const path = "followUser.isFollowingUser";
    const followerId = user.id;

    logger.info({ requestId, path, followerId, followingId }, "Check if is following a user.");

    try {
      const isFollowing = await db.query.follows.findFirst({
        where: (follows, { and, eq }) => and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
      });

      logger.info({ requestId, path, followerId, followingId }, "Following a user checked.");

      return Boolean(isFollowing);
    } catch (error) {
      logger.error({ requestId, path, followerId, followingId, error }, "Failed to check follow status.");

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check follow status. Try again.",
        cause: error,
      });
    }
  });
