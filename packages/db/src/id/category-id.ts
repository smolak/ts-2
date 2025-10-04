import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const CATEGORY_ID_PREFIX = "cat_";
export const CATEGORY_ID_LENGTH = DEFAULT_ID_LENGTH + CATEGORY_ID_PREFIX.length;

export const generateCategoryId = () => generateId(CATEGORY_ID_PREFIX);

export type CategoryId = z.infer<typeof categoryIdSchema>;

export const categoryIdSchema = z
  .string()
  .trim()
  .startsWith(CATEGORY_ID_PREFIX, { message: "ID passed is not a category ID." })
  .length(CATEGORY_ID_PREFIX.length + DEFAULT_ID_LENGTH, { message: "Wrong ID size." });
