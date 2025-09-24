export type ToMaybeValue = (document: Document) => string | undefined;
export type StrictToMaybeValue = [ToMaybeValue, typeof STRICT_CHECK];
export type MetadataGetter = (document: Document, url: string) => string | undefined;

const STRICT_CHECK = "strict" as const;

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
