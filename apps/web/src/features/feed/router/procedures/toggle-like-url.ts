import { orm, schema } from "@repo/db/db";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import type { UserUrl } from "@repo/db/schema";
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
    async ({ input: { userUrlId }, ctx: { logger, requestId, user, db } }) => {
      const path = "likeUrl.toggleLikeUrl";
      const userId = user.id;

      logger.info({ requestId, path, userId, userUrlId }, "Toggle liking the URL.");

      try {
        const [maybeUserUrl] = await db
          .select({
            urlCreatorId: schema.usersUrls.userId,
            likesCount: schema.usersUrls.likesCount,
          })
          .from(schema.usersUrls)
          .where(orm.eq(schema.usersUrls.id, userUrlId))
          .limit(1);

        if (!maybeUserUrl) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User URL not found.",
            cause: new Error("User URL not found."),
          });
        }

        const idOfProfileOwningTheUrl = maybeUserUrl.urlCreatorId;

        // Note: interactionTypeId = 1 represents "LIKED" in the interaction_types table
        const [maybeUserUrlInteraction] = await db
          .select()
          .from(schema.usersUrlsInteractions)
          .where(
            orm.and(
              orm.eq(schema.usersUrlsInteractions.userUrlId, userUrlId),
              orm.eq(schema.usersUrlsInteractions.userId, userId),
              orm.eq(schema.usersUrlsInteractions.interactionTypeId, 1),
            ),
          )
          .limit(1);

        if (maybeUserUrlInteraction) {
          // Liked, unliking
          const likesCount = await db.transaction(async (tx) => {
            const [[result]] = await Promise.all([
              tx
                .update(schema.usersUrls)
                .set({
                  likesCount: orm.sql`${schema.usersUrls.likesCount} - 1`,
                })
                .where(orm.eq(schema.usersUrls.id, userUrlId))
                .returning({ likesCount: schema.usersUrls.likesCount }),

              tx
                .update(schema.userProfiles)
                .set({
                  likedCount: orm.sql`${schema.userProfiles.likedCount} - 1`,
                })
                .where(orm.eq(schema.userProfiles.userId, idOfProfileOwningTheUrl)),

              tx
                .update(schema.userProfiles)
                .set({
                  likesCount: orm.sql`${schema.userProfiles.likesCount} - 1`,
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
