import type { CategoryDto } from "@repo/category/dto/category.dto";
import type { FC } from "react";
import { CategoryListItem } from "./category-list-item";

type CategoriesListProps = {
  categories: ReadonlyArray<CategoryDto>;
  onCategoryDelete: () => void;
};

export const CategoryList: FC<CategoriesListProps> = ({ categories, onCategoryDelete }) => {
  return (
    <ol className="flex flex-col gap-2">
      {categories.map((category) => {
        return (
          <li key={category.id}>
            <CategoryListItem category={category} onCategoryDelete={() => onCategoryDelete()} />
          </li>
        );
      })}
    </ol>
  );
};
