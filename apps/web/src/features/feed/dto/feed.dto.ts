import type { DeckId } from "@repo/db/id/deck-id";
import type { FeedId } from "@repo/db/id/feed-id";
import type { UserId } from "@repo/db/id/user-id";
import type { UserUrlId } from "@repo/db/id/user-url-id";
import type { Deck, Feed, Tag, Url, UserProfile, UserUrl } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";

type Metadata = ScrappedMetadata;

type RawFeedEntry = {
  user_username: UserProfile["username"];
  user_userId: UserId;
  user_imageUrl: UserProfile["imageUrl"];
  feed_id: FeedId;
  feed_createdAt: Feed["createdAt"];
  userUrl_liked: boolean;
  url_url: Url["url"];
  url_metadata: unknown;
  url_likesCount: UserUrl["likesCount"];
  userUrl_id: UserUrlId;
  tag_names: string | null;
  deck_id: DeckId;
  deck_name: Deck["name"];
  deck_slug: Deck["slug"];
  deck_metadata: Deck["metadata"] | null;
};

// Filter metadata to only include known properties from ScrappedMetadata
const filterMetadata = (metadata: unknown): Metadata => {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const validKeys: (keyof Metadata)[] = [
    "author",
    "date",
    "description",
    "faviconUrl",
    "imageUrl",
    "lang",
    "logoUrl",
    "publisher",
    "title",
    "url",
  ];

  const filtered: Partial<Metadata> = {};
  const metadataObj = metadata as Record<string, unknown>;

  for (const key of validKeys) {
    if (key in metadataObj && typeof metadataObj[key] === "string") {
      filtered[key] = metadataObj[key] as string;
    }
  }

  return filtered;
};

export const toFeedDto = (entry: RawFeedEntry): FeedDto => {
  return {
    id: entry.feed_id,
    createdAt: entry.feed_createdAt.toISOString(),
    user: {
      id: entry.user_userId,
      imageUrl: entry.user_imageUrl,
      username: entry.user_username,
    },
    url: {
      url: entry.url_url,
      metadata: filterMetadata(entry.url_metadata),
      likesCount: entry.url_likesCount,
      liked: entry.userUrl_liked || false,
      tagNames: entry.tag_names ? entry.tag_names.split(",") : [],
    },
    userUrlId: entry.userUrl_id,
    deck: {
      id: entry.deck_id,
      name: entry.deck_name,
      slug: entry.deck_slug,
      metadata: (entry.deck_metadata ?? {}) as DeckMetadata,
    },
  };
};

type ISODateString = string;

export type FeedDto = {
  id: FeedId;
  createdAt: ISODateString;
  user: {
    id: UserId;
    imageUrl: UserProfile["imageUrl"];
    username: UserProfile["username"];
  };
  url: {
    url: Url["url"];
    metadata: Metadata;
    liked: boolean;
    likesCount: UserUrl["likesCount"];
    tagNames: Tag["name"][];
  };
  userUrlId: UserUrlId;
  deck: {
    id: DeckId;
    name: Deck["name"];
    slug: Deck["slug"];
    metadata: DeckMetadata;
  };
};
