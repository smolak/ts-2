import { getAuthor } from "./data/author";
import { getDate } from "./data/date";
import { getDescription } from "./data/description";
import { getFavicon } from "./data/favicon";
import { getImageData } from "./data/image-data";
import { getLang } from "./data/lang";
import { getLogo } from "./data/logo";
import { getPublisher } from "./data/publisher";
import { getTitle } from "./data/title";
import { getUrl } from "./data/url";
import type { MetadataGetter, ScrappedMetadata } from "./types";

const getters: Array<[keyof ScrappedMetadata, MetadataGetter]> = [
  ["author", getAuthor],
  ["date", getDate],
  ["description", getDescription],
  ["faviconUrl", getFavicon],
  ["lang", getLang],
  ["logoUrl", getLogo],
  ["publisher", getPublisher],
  ["title", getTitle],
  ["url", getUrl],
] as const;

export const scrapeMetadata = ({ document, url }: { document: Document; url: string }) => {
  const metadata = getters.reduce((acc, [key, getter]) => {
    acc[key] = getter(document, url);

    return acc;
  }, {} as ScrappedMetadata);

  // Get image URL and alt from the same source to ensure consistency
  const imageData = getImageData(document, url);
  metadata.imageUrl = imageData.url;
  metadata.imageAlt = imageData.alt;

  return metadata;
};
