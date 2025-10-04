import type { CategoryDto } from "@repo/category/dto/category.dto";
import type { Category } from "@repo/db/schema";
import { Settings } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

import { CategoryPickerCategoriesList } from "./category-picker-categories-list";

type CategoryPickerProps = {
  categories: ReadonlyArray<CategoryDto>;
  selectedCategories: Category["id"][];
  onCategorySelectionChange: (id: Category["id"]) => void;
  description: string;
  showSettingsLink?: boolean;
};

export const CategoryPicker: FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  onCategorySelectionChange,
  description,
  showSettingsLink = true,
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
        {showSettingsLink ? (
          <span className="flex items-center gap-2">
            <Link href="/settings/categories" className="cursor-pointer rounded p-1.5 hover:bg-slate-100">
              <Settings size={14} className="text-slate-400" />
            </Link>
          </span>
        ) : null}
      </header>
      <CategoryPickerCategoriesList
        categories={categoryPickerCategories}
        onCategorySelectionChange={onCategorySelectionChange}
      />
    </section>
  );
};
