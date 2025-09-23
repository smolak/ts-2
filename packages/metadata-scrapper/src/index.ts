import { getAuthor } from "./data/author";
import { getDate } from "./data/date";
import { getDescription } from "./data/description";
import { getFavicon } from "./data/favicon";
import { getImage } from "./data/image";
import { getLang } from "./data/lang";
import { getLogo } from "./data/logo";
import { getPublisher } from "./data/publisher";
import { getTitle } from "./data/title";
import { getUrl } from "./data/url";
import type { MetadataGetter } from "./types";

export type ScrappedMetadata = {
  author?: string;
  date?: string;
  description?: string;
  faviconUrl?: string;
  imageUrl?: string;
  lang?: string;
  logoUrl?: string;
  publisher?: string;
  title?: string;
  url?: string;
};

const getters: Array<[keyof ScrappedMetadata, MetadataGetter]> = [
  ["author", getAuthor],
  ["date", getDate],
  ["description", getDescription],
  ["faviconUrl", getFavicon],
  ["imageUrl", getImage],
  ["lang", getLang],
  ["logoUrl", getLogo],
  ["publisher", getPublisher],
  ["title", getTitle],
  ["url", getUrl],
] as const;

export const scrapeMetadata = ({ document, url }: { document: Document; url: string }) => {
  return getters.reduce((acc, [key, getter]) => {
    acc[key] = getter(document, url);

    return acc;
  }, {} as ScrappedMetadata);
};
