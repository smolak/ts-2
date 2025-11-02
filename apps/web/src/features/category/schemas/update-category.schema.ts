import { categoryNameSchema } from "@repo/category/name/category-name.schema";
import { categoryIdSchema } from "@repo/db/id/category-id";
import { z } from "zod";

export const updateCategorySchema = z.object({
  id: categoryIdSchema,
  name: categoryNameSchema,
});

export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
