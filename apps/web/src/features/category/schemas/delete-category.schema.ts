import { categoryIdSchema } from "@repo/db/id/category-id";
import { z } from "zod";

export const deleteCategorySchema = z.object({
  id: categoryIdSchema,
});

export type DeleteCategorySchema = z.infer<typeof deleteCategorySchema>;
