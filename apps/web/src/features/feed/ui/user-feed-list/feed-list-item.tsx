import { LinkCard, type LinkCardData } from "@repo/ui/components/link-card";
import type { FC, ReactNode } from "react";

import type { FeedDto } from "../../dto/feed.dto";

type FeedListItemProps = {
  feedItem: FeedDto;
  interactions: ReactNode;
  optionsDropdown?: ReactNode;
};

// Map FeedDto to LinkCardData
const toCardData = (feedItem: FeedDto): LinkCardData => {
  const { url, createdAt, user, deck } = feedItem;
  return {
    url: url.url,
    title: url.metadata.title,
    description: url.metadata.description,
    imageUrl: url.metadata.imageUrl,
    faviconUrl: url.metadata.faviconUrl,
    logoUrl: url.metadata.logoUrl,
    author: url.metadata.author,
    publisher: url.metadata.publisher,
    date: url.metadata.date,
    lang: url.metadata.lang,
    likesCount: url.likesCount,
    liked: url.liked,
    tagNames: url.tagNames,
    addedAt: createdAt,
    deckName: deck?.name,
    deckSlug: deck?.slug,
    user: {
      username: user.username,
      avatarUrl: user.imageUrl ?? undefined,
    },
  };
};

export const FeedListItem: FC<FeedListItemProps> = ({ feedItem, interactions, optionsDropdown }) => {
  return <LinkCard data={toCardData(feedItem)} interactions={interactions} optionsDropdown={optionsDropdown} />;
};
