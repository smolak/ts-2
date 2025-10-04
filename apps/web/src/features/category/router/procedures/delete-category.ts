import { orm, schema } from "@repo/db/db";
import { categoryIdSchema } from "@repo/db/id/category-id";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../../server/api/trpc";

export type DeleteCategorySchema = z.infer<typeof deleteCategorySchema>;

export const deleteCategorySchema = z.object({
  id: categoryIdSchema,
});

export const deleteCategory = protectedProcedure
  .input(deleteCategorySchema)
  .mutation(async ({ input: { id }, ctx: { logger, requestId, userId, db } }) => {
    const path = "category.deleteCategory";

    const maybeCategory = await db.query.categories.findFirst({
      where: (categories, { and, eq }) => and(eq(categories.userId, userId), eq(categories.id, id)),
    });

    if (!maybeCategory) {
      logger.error({ requestId, path }, `Category (${id}) doesn't exist.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Category doesn't exists.`,
      });
    }

    await db.delete(schema.categories).where(orm.eq(schema.categories.id, id));

    logger.info({ requestId, path, id }, `Category (${id})} deleted.`);
  });
