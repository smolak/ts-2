import { orm, schema } from "@repo/db/db";
import { tagIdSchema } from "@repo/db/id/tag-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { selectTagIdsForUpdate } from "@/features/url/router/procedures/utils/select-tag-ids-for-update";
import { protectedProcedure } from "@/server/api/trpc";

export type UpdateUserUrlSchema = z.infer<typeof updateUserUrlSchema>;

export const updateUserUrlSchema = z.object({
  userUrlId: userUrlIdSchema,
  tagIds: z.array(tagIdSchema),
});

export const updateUserUrl = protectedProcedure
  .input(updateUserUrlSchema)
  .mutation(async ({ input: { userUrlId, tagIds }, ctx: { logger, requestId, userId, db } }) => {
    const path = "userUrl.updateUserUrl";

    // Verify the userUrl belongs to the current user
    const maybeUserUrl = await db.query.usersUrls.findFirst({
      where: (usersUrls, { and, eq }) => and(eq(usersUrls.id, userUrlId), eq(usersUrls.userId, userId)),
    });

    if (!maybeUserUrl) {
      logger.error({ requestId, path }, `UserUrl (${userUrlId}) doesn't exist or doesn't belong to user.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `UserUrl doesn't exist or doesn't belong to user.`,
      });
    }

    // Get current tags
    const currentUserUrlTags = await db.query.userUrlsTags.findMany({
      columns: {
        tagId: true,
      },
      where: (userUrlsTags, { eq }) => eq(userUrlsTags.userUrlId, userUrlId),
    });

    const currentTagIds = currentUserUrlTags.map(({ tagId }) => tagId);

    // Determine which tags to add and remove
    const { increment, decrement } = selectTagIdsForUpdate({
      currentTagIds,
      newTagIds: tagIds,
    });

    await db.transaction(async (tx) => {
      // Remove tags that are no longer selected
      if (decrement.length > 0) {
        await tx
          .delete(schema.userUrlsTags)
          .where(
            orm.and(
              orm.eq(schema.userUrlsTags.userUrlId, userUrlId),
              orm.inArray(schema.userUrlsTags.tagId, decrement),
            ),
          );

        // Decrement urlsCount for removed tags
        await tx
          .update(schema.tags)
          .set({
            urlsCount: orm.sql`${schema.tags.urlsCount} - 1`,
          })
          .where(orm.inArray(schema.tags.id, decrement));
      }

      // Add new tags
      if (increment.length > 0) {
        const dataToAdd = increment.map((tagId, index) => ({
          tagId,
          userUrlId,
          tagOrder: currentTagIds.length + index + 1,
        }));

        await tx.insert(schema.userUrlsTags).values(dataToAdd);

        // Increment urlsCount for added tags
        await tx
          .update(schema.tags)
          .set({
            urlsCount: orm.sql`${schema.tags.urlsCount} + 1`,
          })
          .where(orm.inArray(schema.tags.id, increment));
      }
    });

    logger.info({ requestId, path, userUrlId }, "UserUrl updated.");

    return { success: true };
  });
