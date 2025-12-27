"use client";

import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { useEffect } from "react";
import { useDecksStore } from "@/features/deck/stores/use-decks-store";
import { api } from "@/trpc/react";
import { FeedListFilters } from "../feed/ui/feed-list-filters";
import { InfiniteUserFeed } from "../feed/ui/user-feed-list/infinite-user-feed";
import { useTagsStore } from "../tag/stores/use-tags-store";
import { ErrorLoadingTags } from "../tag/ui/tag-picker/error-loading-tags";
import { useUserId } from "../user/hooks/use-user-id";

export const LoggedInUserContent = () => {
  // biome-ignore lint/style/noNonNullAssertion: At this point in time, the user is logged in
  const userId = useUserId()!;

  const {
    data: tags,
    isLoading: tagsLoading,
    isSuccess: tagsSuccess,
    isError: tagsError,
    isRefetching: tagsRefetching,
    refetch: refetchTags,
  } = api.tags.getUserTags.useQuery();

  const { data: decks, isSuccess: decksSuccess, refetch: refetchDecks } = api.decks.getUserDecks.useQuery();

  // TODO:  This is probably not needed OR fetching the tags should be moved to the store
  const { setTags, shouldRefetchTags, setShouldRefetchTags } = useTagsStore();
  const { setDecks, shouldRefetchDecks, setShouldRefetchDecks } = useDecksStore();

  useEffect(() => {
    if (tagsSuccess) {
      setTags(tags);
    }
  }, [tags, tagsSuccess, setTags]);

  useEffect(() => {
    if (decksSuccess) {
      setDecks(decks);
    }
  }, [decks, decksSuccess, setDecks]);

  useEffect(() => {
    if (shouldRefetchTags) {
      refetchTags();
      setShouldRefetchTags(false);
    }
  }, [shouldRefetchTags, setShouldRefetchTags, refetchTags]);

  useEffect(() => {
    if (shouldRefetchDecks) {
      refetchDecks();
      setShouldRefetchDecks(false);
    }
  }, [shouldRefetchDecks, setShouldRefetchDecks, refetchDecks]);

  const isLoading = tagsLoading;
  const isSuccess = tagsSuccess && decksSuccess;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Your Feed</h1>
      </div>
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <LoadingIndicator label="Fetching data" />
          </div>
        ) : null}
        {tagsError ? <ErrorLoadingTags onLoadTagsClick={() => !tagsRefetching && refetchTags()} /> : null}
        {isSuccess ? (
          <div className="flex flex-col gap-7">
            <FeedListFilters tags={tags} decks={decks} username="Me" />
          </div>
        ) : null}
        <InfiniteUserFeed userId={userId} viewerId={userId} />
      </div>
    </>
  );
};
