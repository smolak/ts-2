import { z } from "zod";
import { categoryNameSchema } from "../name/category-name.schema";

export type AddCategoryBody = z.infer<typeof addCategoryBodySchema>;

export const addCategoryBodySchema = z.object({
  name: categoryNameSchema,
});

export type AddCategorySuccessResponse = { success: true };
