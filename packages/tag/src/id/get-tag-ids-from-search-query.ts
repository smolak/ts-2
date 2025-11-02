import { tagIdSchema } from "@repo/db/id/tag-id";

export const getTagIdsFromSearchQuery = (maybeTagIds?: string | string[]) => {
  if (!maybeTagIds) {
    return [];
  }

  // Handle array input
  if (Array.isArray(maybeTagIds)) {
    return maybeTagIds.filter((maybeTagId) => {
      return tagIdSchema.safeParse(maybeTagId).success;
    });
  }

  // Handle string input
  const trimmedInput = maybeTagIds.trim();
  if (!trimmedInput) {
    return [];
  }

  return trimmedInput
    .split(",")
    .map((id) => id.trim())
    .filter((maybeTagId) => tagIdSchema.safeParse(maybeTagId).success);
};
