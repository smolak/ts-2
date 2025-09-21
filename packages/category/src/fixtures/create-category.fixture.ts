import { generateCategoryId } from "@repo/db/id/category-id";
import type { Category } from "@repo/db/schema";
import { v4 as uuid } from "uuid";

export const createCategory = (overwrites: Partial<Category> = {}): Category => ({
  id: generateCategoryId(),
  userId: uuid(),
  name: "Category name",
  urlsCount: 0,
  createdAt: new Date(),
  updatedAt: null,
  ...overwrites,
});
