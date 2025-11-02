import type { Category, Feed, Url, UserProfile, UserUrl } from "@repo/db/types";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";

type Metadata = ScrappedMetadata;

type RawFeedEntry = {
  user_username: UserProfile["username"] | null;
  user_userId: UserProfile["userId"] | null;
  user_imageUrl: UserProfile["imageUrl"] | null;
  feed_id: Feed["id"];
  feed_createdAt: Feed["createdAt"];
  userUrl_liked: boolean;
  url_url: Url["url"] | null;
  url_metadata: unknown;
  url_likesCount: UserUrl["likesCount"] | null;
  userUrl_id: UserUrl["id"];
  category_names: string | null;
};

/**
 * 
 * entry: {
    user_username: string | null;
    user_imageUrl: string | null;
    user_userId: string | null;
    feed_id: string;
    feed_createdAt: Date;
    url_url: string | null;
    url_metadata: unknown;
    url_likesCount: number | null;
    userUrl_id: string;
    userUrl_liked: boolean;
    category_names: string | null;
}
 * @returns 
 */

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

// Had to cast here due to obtaining the data using JOINS, which can return null values.
// I know which values can't be null, therefore casting those.
// TODO - add schema to avoid casting? Not sure if this is necessary, to avoid additional complexity.
export const toFeedDTO = (entry: RawFeedEntry): FeedDTO => {
  return {
    id: entry.feed_id,
    createdAt: entry.feed_createdAt.toISOString(),
    user: {
      id: entry.user_userId as UserProfile["userId"],
      imageUrl: entry.user_imageUrl,
      username: entry.user_username as UserProfile["username"],
    },
    url: {
      url: entry.url_url as string,
      metadata: filterMetadata(entry.url_metadata),
      likesCount: entry.url_likesCount as UserUrl["likesCount"],
      liked: entry.userUrl_liked || false,
      categoryNames: entry.category_names ? entry.category_names.split(",") : [],
    },
    userUrlId: entry.userUrl_id,
  };
};

type ISODateString = string;

export type FeedDTO = {
  id: Feed["id"];
  createdAt: ISODateString;
  user: {
    id: UserProfile["userId"];
    imageUrl: UserProfile["imageUrl"];
    username: UserProfile["username"];
  };
  url: {
    url: Url["url"];
    metadata: Metadata;
    liked: boolean;
    likesCount: UserUrl["likesCount"];
    categoryNames: Category["name"][];
  };
  userUrlId: UserUrl["id"];
};
