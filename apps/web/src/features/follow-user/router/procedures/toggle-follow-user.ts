import { TRPCError } from "@trpc/server";
import { orm, schema } from "@workspace/db/db";
import { userIdSchema } from "@workspace/user/id/user-id.schema";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

export const toggleFollowUserSchema = z.object({
  userId: userIdSchema,
});

type ToggleFollowUserResult = {
  status: "following" | "unfollowed";
  userId: schema.User["id"];
  followersCount: schema.UserProfile["followersCount"];
};

export const toggleFollowUser = protectedProcedure
  .input(toggleFollowUserSchema)
  .mutation<ToggleFollowUserResult>(
    async ({ input: { userId: followingId }, ctx: { logger, requestId, user, db } }) => {
      const path = "followUser.toggleFollowUser";
      const followerId = user.id;

      logger.info({ requestId, path, followerId, followingId }, "Toggle following user initiated.");

      try {
        const maybeFollowing = await db.query.follows.findFirst({
          where: (follows, { and, eq }) =>
            and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
        });

        const notFollowing = Boolean(maybeFollowing) === false;

        if (notFollowing) {
          const { followersCount } = await db.transaction(async (tx) => {
            const [[followers]] = await Promise.all([
              tx
                .update(schema.userProfiles)
                .set({
                  followersCount: orm.sql`${schema.userProfiles.followersCount} + 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, followingId))
                .returning({
                  followersCount: schema.userProfiles.followersCount,
                }),

              tx.insert(schema.follows).values({
                followerId,
                followingId,
              }),

              tx
                .update(schema.userProfiles)
                .set({
                  followingCount: orm.sql`${schema.userProfiles.followingCount} + 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, followerId)),
            ]);

            return {
              followersCount: followers?.followersCount as schema.UserProfile["followersCount"],
            };
          });

          logger.info({ requestId, path, followerId, followingId }, "Followed user.");

          return { status: "following", userId: followingId, followersCount };
        } else {
          const { followersCount } = await db.transaction(async (tx) => {
            const [[followers]] = await Promise.all([
              tx
                .update(schema.userProfiles)
                .set({
                  followersCount: orm.sql`${schema.userProfiles.followersCount} - 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, followingId))
                .returning({
                  followersCount: schema.userProfiles.followersCount,
                }),

              tx
                .delete(schema.follows)
                .where(
                  orm.and(
                    orm.eq(schema.follows.followerId, followerId),
                    orm.eq(schema.follows.followingId, followingId),
                  ),
                ),

              tx
                .update(schema.userProfiles)
                .set({
                  followingCount: orm.sql`${schema.userProfiles.followingCount} - 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, followerId)),
            ]);

            return {
              followersCount: followers?.followersCount as schema.UserProfile["followersCount"],
            };
          });

          logger.info({ requestId, path, followerId, followingId }, "Unfollowed user.");

          return { status: "unfollowed", userId: followingId, followersCount };
        }
      } catch (error) {
        logger.error({ requestId, path, followerId, followingId, error }, "Failed to (un)follow a user.");

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to (un)follow this user. Try again.",
          cause: error,
        });
      }
    },
  );
