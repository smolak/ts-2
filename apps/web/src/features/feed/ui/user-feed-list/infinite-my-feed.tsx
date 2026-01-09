"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { FC } from "react";

import { useUserId } from "@/features/user/hooks/use-user-id";
import { api } from "@/trpc/react";

import type { FeedDto } from "../../dto/feed.dto";
import type { GetMyFeedResponse } from "../../router/procedures/get-my-feed";
import { feedSourceSchema } from "../../shared/feed-source";
import { ErrorLoadingFeed } from "../error-loading-feed";
import { LoadingFeed } from "../loading-feed";
import { InfiniteFeedList } from "./infinite-feed-list";

const aggregateFeeds = (data?: InfiniteData<GetMyFeedResponse>) => {
  if (!data) {
    return [];
  }

  return data.pages.reduce((acc, page) => {
    return acc.concat(page.feed);
  }, [] as FeedDto[]);
};

const getNextCursor = (data?: InfiniteData<GetMyFeedResponse>) => {
  return data?.pages[data?.pages.length - 1]?.nextCursor;
};

type InfiniteMyFeedProps = {
  from?: FeedDto["createdAt"];
};

/**
 * Infinite feed component for viewing the authenticated user's own feed.
 * Shows ALL feed entries including private decks.
 * Should only be used when the logged-in user is viewing their own feed.
 */
export const InfiniteMyFeed: FC<InfiniteMyFeedProps> = ({ from }) => {
  // biome-ignore lint/style/noNonNullAssertion: Component is only rendered inside <SignedIn> (see app/page.tsx)
  const userId = useUserId()!;
  const searchParams = useSearchParams();
  const source = feedSourceSchema.parse(searchParams.get("source"));
  const deckId = searchParams.get("deck") ?? undefined;
  const initialCursor = from ? new Date(from) : undefined;

  const { data, isLoading, isError, fetchNextPage, isFetchingNextPage } = api.feeds.getMyFeed.useInfiniteQuery(
    {
      feedSource: source,
      deckId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor,
    },
  );

  if (isLoading) {
    return <LoadingFeed />;
  }

  if (isError) {
    return <ErrorLoadingFeed />;
  }

  const feed = aggregateFeeds(data);
  const shouldLoadMore = Boolean(getNextCursor(data));

  if (feed.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-10">
        <h2 className="font-bold text-md">No URLs yet. Add some!</h2>
      </div>
    );
  }

  return (
    <InfiniteFeedList
      feed={feed}
      loadMore={fetchNextPage}
      shouldLoadMore={shouldLoadMore}
      isFetching={isFetchingNextPage}
      viewerId={userId}
    />
  );
};
