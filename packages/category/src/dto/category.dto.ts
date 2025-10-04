import type { Category } from "@repo/db/schema";

// TODO: probably not needed. The procedure, that returns this Dto, can define the type, as it defines the structure of the returned data.
export type CategoryDto = Pick<Category, "id" | "name" | "urlsCount">;

// TODO: probably not needed. The procedure, that returns this Dto, can define the type, as it defines the structure of the returned data.
export const toCategoryDto = ({ id, name, urlsCount }: Category): CategoryDto => {
  return { id, name, urlsCount };
};
