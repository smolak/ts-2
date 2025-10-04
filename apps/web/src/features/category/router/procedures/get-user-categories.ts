import type { CategoryDto } from "@repo/category/dto/category.dto";
import { userIdSchema } from "@repo/db/id/user-id";
import { z } from "zod";
import { publicProcedure } from "@/server/api/trpc";

export const getUserCategoriesSchema = z.object({
  userId: userIdSchema,
});

type GetUserCategoriesResult = CategoryDto[];

export const getUserCategories = publicProcedure
  .input(getUserCategoriesSchema)
  .query<GetUserCategoriesResult>(async ({ ctx: { logger, requestId, db }, input: { userId } }) => {
    const path = "category.getUserCategories";

    logger.info({ requestId, path, userId }, "Fetching user's categories.");

    const categories = await db.query.categories.findMany({
      columns: {
        id: true,
        name: true,
        urlsCount: true,
      },
      where: (categories, { eq }) => eq(categories.userId, userId),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });

    logger.info({ requestId, path, userId }, "User's categories fetched.");

    return categories;
  });
