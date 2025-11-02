import { categoryNameSchema } from "@repo/category/name/category-name.schema";
import { z } from "zod";

export const createCategorySchema = z.object({
  name: categoryNameSchema,
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
