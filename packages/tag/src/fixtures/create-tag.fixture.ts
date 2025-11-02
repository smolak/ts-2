import { generateTagId } from "@repo/db/id/tag-id";
import type { Tag } from "@repo/db/types";
import { v4 as uuid } from "uuid";

export const createTag = (overwrites: Partial<Tag> = {}): Tag => ({
  id: generateTagId(),
  userId: uuid(),
  name: "Tag name",
  urlsCount: 0,
  createdAt: new Date(),
  updatedAt: null,
  ...overwrites,
});
