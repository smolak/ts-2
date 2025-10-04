import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { z } from "zod";
import { publicProcedure } from "@/server/api/trpc";

export const getUserUrlCategoriesSchema = z.object({
  userUrlId: userUrlIdSchema,
});

export const getUserUrlCategories = publicProcedure
  .input(getUserUrlCategoriesSchema)
  .query(async ({ ctx: { logger, requestId, db }, input: { userUrlId } }) => {
    const path = `category.${getUserUrlCategories.name}`;

    logger.info({ requestId, path, userUrlId }, "Fetching user url's categories.");

    const userUrlCategories = await db.query.userUrlsCategories.findMany({
      columns: {
        categoryId: true,
      },
      where: (userUrlsCategories, { eq }) => eq(userUrlsCategories.userUrlId, userUrlId),
    });

    logger.info({ requestId, path, userUrlId }, "User url's categories fetched.");

    return userUrlCategories;
  });
