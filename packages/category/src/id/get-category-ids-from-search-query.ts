import { categoryIdSchema } from "@repo/db/id/category-id.schema";

export const getCategoryIdsFromSearchQuery = (maybeCategoryIds?: string | string[]) => {
  if (!maybeCategoryIds) {
    return [];
  }

  // Handle array input
  if (Array.isArray(maybeCategoryIds)) {
    return maybeCategoryIds.filter((maybeCategoryId) => {
      return categoryIdSchema.safeParse(maybeCategoryId).success;
    });
  }

  // Handle string input
  const trimmedInput = maybeCategoryIds.trim();
  if (!trimmedInput) {
    return [];
  }

  return trimmedInput
    .split(",")
    .map((id) => id.trim())
    .filter((maybeCategoryId) => {
      return categoryIdSchema.safeParse(maybeCategoryId).success;
    });
};
