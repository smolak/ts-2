import type { Deck } from "@repo/db/types";
import type { DeckMetadata } from "../schemas/deck-metadata.schema";

export type DeckDto = Pick<
  Deck,
  "id" | "name" | "slug" | "isPublic" | "urlsCount" | "followersCount" | "scheduledForDeletionAt"
> & {
  metadata: DeckMetadata;
};

export const toDeckDto = ({
  id,
  name,
  slug,
  isPublic,
  urlsCount,
  followersCount,
  metadata,
  scheduledForDeletionAt,
}: Deck): DeckDto => {
  return {
    id,
    name,
    slug,
    isPublic,
    urlsCount,
    followersCount,
    metadata: metadata as DeckMetadata,
    scheduledForDeletionAt,
  };
};
