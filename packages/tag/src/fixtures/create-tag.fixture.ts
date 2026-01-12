import { generateDeckId } from "@repo/db/id/deck-id";
import { generateTagId } from "@repo/db/id/tag-id";
import type { Tag } from "@repo/db/types";

export const createTag = (overwrites: Partial<Tag> = {}): Tag => ({
  id: generateTagId(),
  deckId: generateDeckId(),
  name: "tag name",
  displayName: "Tag name",
  urlsCount: 0,
  createdAt: new Date(),
  updatedAt: null,
  ...overwrites,
});
