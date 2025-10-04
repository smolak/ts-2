import { UserProfile } from "@workspace/db/types";
import { FC } from "react";

import { CategoryVM } from "@/features/category/models/category.vm";
import { CategoriesSelector } from "@/features/category/ui/categories-selector";

import { UserFeedSourceSelector } from "./user-feed-source-selector";

type FeedListFiltersProps = {
  username: UserProfile["username"];
  categories: ReadonlyArray<CategoryVM>;
};

export const FeedListFilters: FC<FeedListFiltersProps> = ({ username, categories }) => {
  return (
    <aside className="flex justify-between">
      <UserFeedSourceSelector author={username} />
      <CategoriesSelector author={username} categories={categories} />
    </aside>
  );
};
