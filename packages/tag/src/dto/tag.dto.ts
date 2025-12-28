import type { Tag } from "@repo/db/types";

export type TagDto = Pick<Tag, "id" | "name" | "displayName" | "urlsCount">;
