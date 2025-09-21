import type { Category } from "@repo/db/schema";

export type CategoryDto = Pick<Category, "id" | "name" | "urlsCount">;

export const toCategoryDto = ({ id, name, urlsCount }: Category): CategoryDto => {
  return { id, name, urlsCount };
};
