import { orm, schema } from "@repo/db/db";
import { categoryIdSchema } from "@repo/db/id/category-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { selectCategoryIdsForUpdate } from "@/features/url/router/procedures/utils/select-category-ids-for-update";
import { protectedProcedure } from "@/server/api/trpc";

export type UpdateUserUrlSchema = z.infer<typeof updateUserUrlSchema>;

export const updateUserUrlSchema = z.object({
  userUrlId: userUrlIdSchema,
  categoryIds: z.array(categoryIdSchema),
});

export const updateUserUrl = protectedProcedure
  .input(updateUserUrlSchema)
  .mutation(async ({ input: { userUrlId, categoryIds }, ctx: { logger, requestId, userId, db } }) => {
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

    // Get current categories
    const currentUserUrlCategories = await db.query.userUrlsCategories.findMany({
      columns: {
        categoryId: true,
      },
      where: (userUrlsCategories, { eq }) => eq(userUrlsCategories.userUrlId, userUrlId),
    });

    const currentCategoryIds = currentUserUrlCategories.map(({ categoryId }) => categoryId);

    // Determine which categories to add and remove
    const { increment, decrement } = selectCategoryIdsForUpdate({
      currentCategoryIds,
      newCategoryIds: categoryIds,
    });

    await db.transaction(async (tx) => {
      // Remove categories that are no longer selected
      if (decrement.length > 0) {
        await tx
          .delete(schema.userUrlsCategories)
          .where(
            orm.and(
              orm.eq(schema.userUrlsCategories.userUrlId, userUrlId),
              orm.inArray(schema.userUrlsCategories.categoryId, decrement),
            ),
          );

        // Decrement urlsCount for removed categories
        await tx
          .update(schema.categories)
          .set({
            urlsCount: orm.sql`${schema.categories.urlsCount} - 1`,
          })
          .where(orm.inArray(schema.categories.id, decrement));
      }

      // Add new categories
      if (increment.length > 0) {
        const dataToAdd = increment.map((categoryId, index) => ({
          categoryId,
          userUrlId,
          categoryOrder: currentCategoryIds.length + index + 1,
        }));

        await tx.insert(schema.userUrlsCategories).values(dataToAdd);

        // Increment urlsCount for added categories
        await tx
          .update(schema.categories)
          .set({
            urlsCount: orm.sql`${schema.categories.urlsCount} + 1`,
          })
          .where(orm.inArray(schema.categories.id, increment));
      }
    });

    logger.info({ requestId, path, userUrlId }, "UserUrl updated.");

    return { success: true };
  });
