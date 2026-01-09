"use client";

import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { useEffect } from "react";
import { useDecksStore } from "@/features/deck/stores/use-decks-store";
import { api } from "@/trpc/react";
import { FeedListFilters } from "../feed/ui/feed-list-filters";
import { InfiniteMyFeed } from "../feed/ui/user-feed-list/infinite-my-feed";

export const LoggedInUserContent = () => {
  const {
    data: decks,
    isLoading: decksLoading,
    isSuccess: decksSuccess,
    refetch: refetchDecks,
  } = api.decks.getUserDecks.useQuery();

  const { setDecks, shouldRefetchDecks, setShouldRefetchDecks } = useDecksStore();

  useEffect(() => {
    if (decksSuccess) {
      setDecks(decks);
    }
  }, [decks, decksSuccess, setDecks]);

  useEffect(() => {
    if (shouldRefetchDecks) {
      refetchDecks();
      setShouldRefetchDecks(false);
    }
  }, [shouldRefetchDecks, setShouldRefetchDecks, refetchDecks]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Your Feed</h1>
      </div>
      <div className="flex flex-col gap-2">
        {decksLoading ? (
          <div className="flex flex-col items-center">
            <LoadingIndicator label="Fetching data" />
          </div>
        ) : null}
        {decksSuccess ? (
          <div className="flex flex-col gap-7">
            <FeedListFilters decks={decks} username="Me" />
          </div>
        ) : null}
        <InfiniteMyFeed />
      </div>
    </>
  );
};
