"use client";

import type { User } from "@repo/db/types";
import type { InfiniteData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { FC } from "react";

import { useUserId } from "@/features/user/hooks/use-user-id";
import { api } from "@/trpc/react";

import type { FeedDto } from "../../dto/feed.dto";
import type { GetPublicFeedResponse } from "../../router/procedures/get-public-feed";
import { feedSourceSchema } from "../../shared/feed-source";
import { ErrorLoadingFeed } from "../error-loading-feed";
import { LoadingFeed } from "../loading-feed";
import { InfiniteFeedList } from "./infinite-feed-list";

const aggregateFeeds = (data?: InfiniteData<GetPublicFeedResponse>) => {
  if (!data) {
    return [];
  }

  return data.pages.reduce((acc, page) => {
    return acc.concat(page.feed);
  }, [] as FeedDto[]);
};

const getNextCursor = (data?: InfiniteData<GetPublicFeedResponse>) => {
  return data?.pages[data?.pages.length - 1]?.nextCursor;
};

type InfinitePublicFeedProps = {
  from?: FeedDto["createdAt"];
  userId: User["id"];
};

/**
 * Infinite feed component for viewing a user's PUBLIC feed entries.
 * Only shows feed entries from public decks.
 * Used on public profile pages (e.g., /[username]).
 *
 * The viewerId is obtained from the current session to:
 * - Show the viewer's "liked" status on feed items
 * - Prevent users from liking their own URLs or following their own decks
 */
export const InfinitePublicFeed: FC<InfinitePublicFeedProps> = ({ userId, from }) => {
  // It might be me viewing my public feed, so I need to get my own user ID.
  const viewerId = useUserId();
  const searchParams = useSearchParams();
  const source = feedSourceSchema.parse(searchParams.get("source"));
  const deckId = searchParams.get("deck") ?? undefined;
  const initialCursor = from ? new Date(from) : undefined;

  const { data, isLoading, isError, fetchNextPage, isFetchingNextPage } = api.feeds.getPublicFeed.useInfiniteQuery(
    {
      userId,
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
        <h2 className="font-bold text-md">No URLs yet.</h2>
      </div>
    );
  }

  return (
    <InfiniteFeedList
      feed={feed}
      loadMore={fetchNextPage}
      shouldLoadMore={shouldLoadMore}
      isFetching={isFetchingNextPage}
      viewerId={viewerId}
    />
  );
};
