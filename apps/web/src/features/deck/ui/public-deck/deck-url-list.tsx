"use client";

import type { Deck, Tag, Url } from "@repo/db/types";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Calendar, ExternalLink, Globe, Heart, Link2Off, Tag as TagIcon } from "lucide-react";
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

type DeckUrlCardProps = {
  item: DeckUrlItem;
};

const DeckUrlCard: FC<DeckUrlCardProps> = ({ item }) => {
  const metadata = getMetadata(item.metadata);
  const urlWithoutProtocol = item.url.replace(/^https?:\/\//, "");
  const title = metadata.title || urlWithoutProtocol;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={metadata.faviconUrl} alt={`${metadata.publisher} favicon`} />
            <AvatarFallback>
              <Globe className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1 font-semibold text-lg">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline" title={title}>
                {title}
              </a>
            </CardTitle>
            <div className="flex items-center text-muted-foreground text-sm">
              <Globe className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="truncate" title={urlWithoutProtocol}>
                {urlWithoutProtocol}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {metadata.imageUrl && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative max-h-48 overflow-hidden">
            <img src={metadata.imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
          </div>
        </a>
      )}

      <CardContent className="pt-3">
        {metadata.description && (
          <CardDescription className="mb-3 line-clamp-2">{metadata.description}</CardDescription>
        )}

        {item.tagNames.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {item.tagNames.map((tagName) => (
              <Badge key={tagName} variant="secondary" className="text-xs">
                <TagIcon className="mr-1 h-2.5 w-2.5" />
                {tagName}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.addedAt).toLocaleDateString()}
            </span>
            {item.likesCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {item.likesCount}
              </span>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Visit
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingCards: FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardHeader>
        <div className="h-32 w-full animate-pulse bg-muted" />
        <CardContent className="pt-3">
          <div className="mb-3 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
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
        <DeckUrlCard key={item.userUrlId} item={item} />
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
