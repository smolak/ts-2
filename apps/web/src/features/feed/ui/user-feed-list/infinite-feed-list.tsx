import type { UserId } from "@repo/db/id/user-id";
import { type FC, useEffect, useRef } from "react";

import type { FeedDto } from "../../dto/feed.dto";
import { LoadingFeed } from "../loading-feed";
import { FeedList } from "./feed-list";

export interface InfiniteFeedListProps {
  feed: ReadonlyArray<FeedDto>;
  loadMore: () => void;
  shouldLoadMore?: boolean;
  isFetching?: boolean;
  viewerId?: UserId;
}

export const InfiniteFeedList: FC<InfiniteFeedListProps> = ({
  feed,
  viewerId,
  loadMore,
  isFetching,
  shouldLoadMore,
}) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0]?.isIntersecting && shouldLoadMore) {
          loadMore();
        }
      },
      { threshold: 1 },
    );
    const current = observerTarget.current;

    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [loadMore, shouldLoadMore]);

  return (
    <>
      <FeedList feed={feed} viewerId={viewerId} />
      {isFetching && <LoadingFeed />}
      <div ref={observerTarget} />
    </>
  );
};
