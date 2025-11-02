import type { Tag } from "@repo/db/types";

// TODO: probably not needed. The procedure, that returns this Dto, can define the type, as it defines the structure of the returned data.
export type TagDto = Pick<Tag, "id" | "name" | "urlsCount">;

// TODO: probably not needed. The procedure, that returns this Dto, can define the type, as it defines the structure of the returned data.
export const toTagDto = ({ id, name, urlsCount }: Tag): TagDto => {
  return { id, name, urlsCount };
};
