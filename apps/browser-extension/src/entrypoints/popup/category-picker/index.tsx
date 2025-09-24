import type { CategoryDto } from "@repo/category/dto/category.dto";
import type { FC } from "react";

import { CategoryPickerCategoriesList } from "./category-picker-categories-list";

type CategoryPickerProps = {
  categories: ReadonlyArray<CategoryDto>;
  selectedCategories: CategoryDto["id"][];
  onCategorySelectionChange: (id: CategoryDto["id"]) => void;
  description: string;
};

export const CategoryPicker: FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  onCategorySelectionChange,
  description,
}) => {
  const categoryPickerCategories = categories.map((category) => {
    return {
      ...category,
      selected: selectedCategories.indexOf(category.id) >= 0,
    };
  });

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h3 className="text-xs font-light text-slate-400">{description}</h3>
      </header>
      <CategoryPickerCategoriesList
        categories={categoryPickerCategories}
        onCategorySelectionChange={onCategorySelectionChange}
      />
    </section>
  );
};
