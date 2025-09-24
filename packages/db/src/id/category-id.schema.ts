import { DEFAULT_ID_LENGTH } from "@repo/shared/utils/generate-id";
import { z } from "zod";
import { CATEGORY_ID_PREFIX } from "./category-id";

export type CategoryId = z.infer<typeof categoryIdSchema>;

// TODO: move this to category-id.ts. Do the same with other schemas in this folder.
export const categoryIdSchema = z
  .string()
  .trim()
  .startsWith(CATEGORY_ID_PREFIX, { message: "ID passed is not a category ID." })
  .length(CATEGORY_ID_PREFIX.length + DEFAULT_ID_LENGTH, { message: "Wrong ID size." });
