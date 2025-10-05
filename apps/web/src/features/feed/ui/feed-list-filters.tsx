import type { CategoryDto } from "@repo/category/dto/category.dto";
import type { UserProfile } from "@repo/db/schema";
import type { FC } from "react";
import { CategoriesSelector } from "@/features/category/ui/categories-selector";
import { UserFeedSourceSelector } from "./user-feed-source-selector";

type FeedListFiltersProps = {
  username: UserProfile["username"];
  categories: ReadonlyArray<CategoryDto>;
};

export const FeedListFilters: FC<FeedListFiltersProps> = ({ username, categories }) => {
  return (
    <aside className="flex justify-between">
      <UserFeedSourceSelector author={username} />
      <CategoriesSelector author={username} categories={categories} />
    </aside>
  );
};
