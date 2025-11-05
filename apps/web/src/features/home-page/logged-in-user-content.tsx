"use client";

import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { useEffect } from "react";
import { api } from "@/trpc/react";
import { FeedListFilters } from "../feed/ui/feed-list-filters";
import { InfiniteUserFeed } from "../feed/ui/user-feed-list/infinite-user-feed";
import { useTagsStore } from "../tag/stores/use-tags-store";
import { ErrorLoadingTags } from "../tag/ui/tag-picker/error-loading-tags";
import { useUserId } from "../user/hooks/use-user-id";

export const LoggedInUserContent = () => {
  // biome-ignore lint/style/noNonNullAssertion: At this point in time, the user is logged in
  const userId = useUserId()!;

  const { data: tags, isLoading, isSuccess, isError, isRefetching, refetch } = api.tags.getUserTags.useQuery();

  // TODO:  This is probably not needed OR fetching the tags should be moved to the store
  const { setTags, shouldRefetchTags, setShouldRefetchTags } = useTagsStore();

  useEffect(() => {
    if (isSuccess) {
      setTags(tags);
    }
  }, [tags, isSuccess, setTags]);

  useEffect(() => {
    if (shouldRefetchTags) {
      refetch();
      setShouldRefetchTags(false);
    }
  }, [shouldRefetchTags, setShouldRefetchTags, refetch]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Your Feed</h1>
      </div>
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <LoadingIndicator label="Fetching tags" />
          </div>
        ) : null}
        {isError ? <ErrorLoadingTags onLoadTagsClick={() => !isRefetching && refetch()} /> : null}
        {isSuccess ? <div className="flex flex-col gap-7">{<FeedListFilters tags={tags} username="Me" />}</div> : null}
        <InfiniteUserFeed userId={userId} viewerId={userId} />
      </div>
    </>
  );
};
