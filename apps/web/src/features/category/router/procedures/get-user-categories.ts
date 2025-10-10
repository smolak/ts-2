import type { CategoryDto } from "@repo/category/dto/category.dto";
import { protectedProcedure } from "@/server/api/trpc";

type GetUserCategoriesResult = CategoryDto[];

export const getUserCategories = protectedProcedure.query<GetUserCategoriesResult>(
  async ({ ctx: { logger, requestId, db, userId } }) => {
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
  },
);
