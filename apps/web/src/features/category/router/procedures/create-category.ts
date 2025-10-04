import { categoryNameSchema } from "@repo/category/name/category-name.schema";
import { schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;

export const createCategorySchema = z.object({
  name: categoryNameSchema,
});

type CreateCategoryResult = {
  categoryId: schema.Category["id"];
};

export const createCategory = protectedProcedure
  .input(createCategorySchema)
  .mutation<CreateCategoryResult>(async ({ input: { name }, ctx: { logger, requestId, user, db } }) => {
    const path = "category.createCategory";
    const userId = user.id;

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
