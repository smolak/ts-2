import { orm, schema } from "@repo/db/db";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import type { UserUrl } from "@repo/db/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

export const toggleLikeUrlSchema = z.object({
  userUrlId: userUrlIdSchema,
});

type ToggleLikeUrlResult = {
  status: "liked" | "unliked";
  likesCount: UserUrl["likesCount"];
  userUrlId: UserUrl["id"];
};

type UrlNotFound = {
  status: "notFound";
  userUrlId: UserUrl["id"];
};

export const toggleLikeUrl = protectedProcedure
  .input(toggleLikeUrlSchema)
  .mutation<UrlNotFound | ToggleLikeUrlResult>(
    async ({ input: { userUrlId }, ctx: { logger, requestId, userId, db } }) => {
      const path = "likeUrl.toggleLikeUrl";

      logger.info({ requestId, path, userId, userUrlId }, "Toggle liking the URL.");

      try {
        // Combine URL lookup and like status check into a single query with LEFT JOIN
        const [result] = await db
          .select({
            urlCreatorId: schema.usersUrls.userId,
            likesCount: schema.usersUrls.likesCount,
            isLiked: schema.usersUrlsInteractions.interactionTypeId,
          })
          .from(schema.usersUrls)
          .leftJoin(
            schema.usersUrlsInteractions,
            orm.and(
              orm.eq(schema.usersUrlsInteractions.userUrlId, schema.usersUrls.id),
              orm.eq(schema.usersUrlsInteractions.userId, userId),
              orm.eq(schema.usersUrlsInteractions.interactionTypeId, 1),
            ),
          )
          .where(orm.eq(schema.usersUrls.id, userUrlId))
          .limit(1);

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User URL not found.",
            cause: new Error("User URL not found."),
          });
        }

        const idOfProfileOwningTheUrl = result.urlCreatorId;
        const maybeUserUrlInteraction = result.isLiked;

        // Prevent users from liking their own URLs
        if (idOfProfileOwningTheUrl === userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot like your own URL.",
            cause: new Error("User attempted to like their own URL."),
          });
        }

        if (maybeUserUrlInteraction) {
          // Liked, unliking
          const likesCount = await db.transaction(async (tx) => {
            const [[result]] = await Promise.all([
              tx
                .update(schema.usersUrls)
                .set({
                  likesCount: orm.sql`GREATEST(0, ${schema.usersUrls.likesCount} - 1)`,
                })
                .where(orm.eq(schema.usersUrls.id, userUrlId))
                .returning({ likesCount: schema.usersUrls.likesCount }),

              tx
                .update(schema.userProfiles)
                .set({
                  likedCount: orm.sql`GREATEST(0, ${schema.userProfiles.likedCount} - 1)`,
                })
                .where(orm.eq(schema.userProfiles.userId, idOfProfileOwningTheUrl)),

              tx
                .update(schema.userProfiles)
                .set({
                  likesCount: orm.sql`GREATEST(0, ${schema.userProfiles.likesCount} - 1)`,
                })
                .where(orm.eq(schema.userProfiles.userId, userId)),

              tx
                .delete(schema.usersUrlsInteractions)
                .where(
                  orm.and(
                    orm.eq(schema.usersUrlsInteractions.userUrlId, userUrlId),
                    orm.eq(schema.usersUrlsInteractions.userId, userId),
                    orm.eq(schema.usersUrlsInteractions.interactionTypeId, 1),
                  ),
                ),
            ]);

            return result?.likesCount as number;
          });

          logger.info({ requestId, path, userId, userUrlId }, "Unliked the URL.");

          return { status: "unliked", userUrlId, likesCount };
        } else {
          // not liked, liking
          const likesCount = await db.transaction(async (tx) => {
            const [[result]] = await Promise.all([
              tx
                .update(schema.usersUrls)
                .set({
                  likesCount: orm.sql`${schema.usersUrls.likesCount} + 1`,
                })
                .where(orm.eq(schema.usersUrls.id, userUrlId))
                .returning({ likesCount: schema.usersUrls.likesCount }),

              tx
                .update(schema.userProfiles)
                .set({
                  likedCount: orm.sql`${schema.userProfiles.likedCount} + 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, idOfProfileOwningTheUrl)),

              tx
                .update(schema.userProfiles)
                .set({
                  likesCount: orm.sql`${schema.userProfiles.likesCount} + 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, userId)),

              tx.insert(schema.usersUrlsInteractions).values({
                userUrlId,
                userId,
                interactionTypeId: 1, // 1 = "LIKED" in interaction_types table
              }),
            ]);

            return result?.likesCount as number;
          });

          logger.info({ requestId, path, userId, userUrlId }, "Liked the URL.");

          return { status: "liked", userUrlId, likesCount };
        }
      } catch (error) {
        logger.error({ requestId, path, userId, userUrlId, error }, "Failed to (un)like a URL.");

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to (un)like the URL. Try again.",
          cause: error,
        });
      }
    },
  );
