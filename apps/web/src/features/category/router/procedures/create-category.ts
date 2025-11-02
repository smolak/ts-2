import { schema } from "@repo/db/db";
import type { Category } from "@repo/db/types";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import {
  type CreateCategorySchema,
  createCategorySchema,
} from "../../schemas/create-category.schema";

// TODO: Split schema exports from server-only procedures for all router procedures to prevent client-side imports of server code
export type { CreateCategorySchema };
export { createCategorySchema };

type CreateCategoryResult = {
  categoryId: Category["id"];
};

export const createCategory = protectedProcedure
  .input(createCategorySchema)
  .mutation<CreateCategoryResult>(async ({ input: { name }, ctx: { logger, requestId, userId, db } }) => {
    const path = "category.createCategory";

    const maybeCategory = await db.query.categories.findFirst({
      where: (categories, { and, eq }) => and(eq(categories.userId, userId), eq(categories.name, name)),
    });

    if (maybeCategory) {
      logger.error({ requestId, path }, `Category (${name}) exists.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Category name exists. Use different category name.`,
      });
    }

    const [result] = await db
      .insert(schema.categories)
      .values({ userId, name })
      .returning({ insertedId: schema.categories.id });

    if (!result) {
      logger.error({ requestId, path }, `Category ID not retrieved for created category (${name}).`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Category could not be created.`,
      });
    }

    logger.info({ requestId, path, name }, "Category created.");

    return { categoryId: result.insertedId };
  });
