export type ToMaybeValue = (document: Document) => string | undefined;
export type StrictToMaybeValue = [ToMaybeValue, typeof STRICT_CHECK];
export type MetadataGetter = (document: Document, url: string) => string | undefined;

const STRICT_CHECK = "strict" as const;
