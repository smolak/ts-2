"use client";

import type { User } from "@repo/db/schema";
import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { useEffect } from "react";

import { api } from "@/trpc/react";

import { useCategoriesStore } from "../category/stores/use-categories-store";
import { ErrorLoadingCategories } from "../category/ui/category-picker/error-loading-categories";
import { FeedListFilters } from "../feed/ui/feed-list-filters";
import { InfiniteUserFeed } from "../feed/ui/user-feed-list/infinite-user-feed";

export const LoggedInUserContent = ({ userId }: { userId: User["id"] }) => {
  const {
    data: categories,
    isLoading,
    isSuccess,
    isError,
    isRefetching,
    refetch,
  } = api.categories.getUserCategories.useQuery({ userId });

  const { setCategories, shouldRefetchCategories, setShouldRefetchCategories } = useCategoriesStore();

  useEffect(() => {
    if (isSuccess) {
      setCategories(categories);
    }
  }, [categories, isSuccess, setCategories]);

  useEffect(() => {
    if (shouldRefetchCategories) {
      refetch();
      setShouldRefetchCategories(false);
    }
  }, [shouldRefetchCategories, setShouldRefetchCategories, refetch]);

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <div className="flex flex-col items-center">
          <LoadingIndicator label="Fetching categories" />
        </div>
      ) : null}
      {isError ? <ErrorLoadingCategories onLoadCategoriesClick={() => !isRefetching && refetch()} /> : null}
      {isSuccess ? (
        <div className="flex flex-col gap-7">{<FeedListFilters categories={categories} username="Me" />}</div>
      ) : null}
      <InfiniteUserFeed userId={userId} viewerId={userId} />
    </div>
  );
};
