"use client";

import type { Deck, Tag, Url } from "@repo/db/types";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import { Card, CardContent } from "@repo/ui/components/card";
import { LinkCard, type LinkCardData, LinkCardSkeleton } from "@repo/ui/components/link-card";
import { Link2Off } from "lucide-react";
import { type FC, useEffect, useRef } from "react";

import { api, type RouterOutputs } from "@/trpc/react";

type GetDeckUrlsResultMaybe = RouterOutputs["decks"]["getDeckUrls"];
type GetDeckUrlsResult = NonNullable<GetDeckUrlsResultMaybe>;
type DeckUrlItem = GetDeckUrlsResult["items"][number];

// Helper to safely cast metadata to ScrappedMetadata
const getMetadata = (metadata: Url["metadata"]): ScrappedMetadata => {
  return (metadata ?? {}) as ScrappedMetadata;
};

// Helper to aggregate URLs from infinite query pages
const aggregateUrls = (data: { pages: GetDeckUrlsResultMaybe[] } | undefined): DeckUrlItem[] => {
  if (!data) {
    return [];
  }

  return data.pages.reduce((acc, page) => {
    if (!page) return acc;
    return acc.concat(page.items);
  }, [] as DeckUrlItem[]);
};

// Map DeckUrlItem to LinkCardData
const toCardData = (item: DeckUrlItem): LinkCardData => {
  const metadata = getMetadata(item.metadata);
  return {
    url: item.url,
    title: metadata.title,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    faviconUrl: metadata.faviconUrl,
    logoUrl: metadata.logoUrl,
    author: metadata.author,
    publisher: metadata.publisher,
    date: metadata.date,
    lang: metadata.lang,
    likesCount: item.likesCount,
    tagNames: item.tagNames,
    addedAt: item.addedAt.toISOString(),
  };
};

const LoadingCards: FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <LinkCardSkeleton key={i} />
    ))}
  </div>
);

type DeckUrlListProps = {
  deckId: Deck["id"];
  tagIds?: Tag["id"][];
};

export const DeckUrlList: FC<DeckUrlListProps> = ({ deckId, tagIds = [] }) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, fetchNextPage, isFetchingNextPage, hasNextPage } =
    api.decks.getDeckUrls.useInfiniteQuery(
      { deckId, tagIds, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
      },
    );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return <LoadingCards />;
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-6 text-red-700">
          <Link2Off className="h-5 w-5" />
          <span>Failed to load URLs. Please try again.</span>
        </CardContent>
      </Card>
    );
  }

  const urls = aggregateUrls(data);

  if (urls.length === 0) {
    const hasTagFilter = tagIds.length > 0;
    return (
      <Card className="bg-slate-50">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Link2Off className="h-10 w-10 text-slate-400" />
          <p className="font-medium text-slate-600">
            {hasTagFilter ? "No URLs match the selected tags" : "No URLs in this deck yet"}
          </p>
          <p className="text-slate-500 text-sm">
            {hasTagFilter
              ? "Try selecting different tags or clear the filter."
              : "The deck owner hasn't added any links."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {urls.map((item) => (
        <LinkCard key={item.userUrlId} data={toCardData(item)} />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      )}
    </div>
  );
};
