import type { TagId } from "@repo/db/id/tag-id";

export const selectTagIdsForUpdate = ({ currentTagIds, newTagIds }: { currentTagIds: TagId[]; newTagIds: TagId[] }) => {
  const currentSet = new Set(currentTagIds);
  const newSet = new Set(newTagIds);

  const increment = newTagIds.filter((id) => !currentSet.has(id));
  const decrement = currentTagIds.filter((id) => !newSet.has(id));

  return {
    increment,
    decrement,
  };
};
