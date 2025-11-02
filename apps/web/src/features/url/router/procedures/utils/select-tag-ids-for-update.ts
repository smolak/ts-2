import type { TagId } from "@repo/db/id/tag-id";

export const selectTagIdsForUpdate = ({
  currentTagIds,
  newTagIds,
}: {
  currentTagIds: TagId[];
  newTagIds: TagId[];
}) => {
  const increment = newTagIds.filter((id) => currentTagIds.indexOf(id) === -1);
  const decrement = currentTagIds.filter((id) => newTagIds.indexOf(id) === -1);

  return {
    increment,
    decrement,
  };
};
