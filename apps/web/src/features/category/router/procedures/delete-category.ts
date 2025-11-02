import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import {
  type DeleteCategorySchema,
  deleteCategorySchema,
} from "../../schemas/delete-category.schema";

// TODO: Split schema exports from server-only procedures for all router procedures to prevent client-side imports of server code
export type { DeleteCategorySchema };
export { deleteCategorySchema };

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
