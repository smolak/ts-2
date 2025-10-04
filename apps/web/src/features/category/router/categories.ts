import { createTRPCRouter } from "@/server/api/trpc";
import { createCategory } from "./procedures/create-category";
import { deleteCategory } from "./procedures/delete-category";
import { getUserCategories } from "./procedures/get-user-categories";
import { getUserUrlCategories } from "./procedures/get-user-url-categories";
import { updateCategory } from "./procedures/update-category";

export const categoriesRouter = createTRPCRouter({
  createCategory,
  deleteCategory,
  getUserCategories,
  getUserUrlCategories,
  updateCategory,
});
