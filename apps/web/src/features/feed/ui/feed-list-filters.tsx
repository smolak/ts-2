import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { UserProfile } from "@repo/db/types";
import type { FC } from "react";
import { TagsSelector } from "@/features/tag/ui/tags-selector";
import { UserFeedSourceSelector } from "./user-feed-source-selector";

type FeedListFiltersProps = {
  username: UserProfile["username"];
  tags: ReadonlyArray<TagDto>;
};

export const FeedListFilters: FC<FeedListFiltersProps> = ({ username, tags }) => {
  return (
    <aside className="flex justify-between">
      <UserFeedSourceSelector author={username} />
      <TagsSelector author={username} tags={tags} />
    </aside>
  );
};
