"use client";

import { Lightbulb } from "lucide-react";
import type { FC } from "react";
import { api } from "@/trpc/react";
import { AddCategory } from "../add-category";
import { CategoryList } from "./category-list";
import { ErrorLoadingCategories } from "./error-loading-categories";
import { LoadingCategories } from "./loading-categories";

export const CategoriesSettings: FC = () => {
  const { data, isLoading, isError, refetch } = api.categories.getUserCategories.useQuery();

  if (isLoading) {
    return <LoadingCategories />;
  }

  if (isError) {
    return <ErrorLoadingCategories />;
  }

  return (
    <div className="flex flex-col gap-6 md:max-w-[450px]">
      <AddCategory onCategoryAdd={() => refetch()} />
      <div className="flex flex-col gap-2">
        {data && data.length > 0 ? (
          <p className="flex items-center gap-2 rounded-md border-yellow-500 border-l-4 bg-slate-50 px-2 py-1 text-slate-600 text-sm">
            <Lightbulb size={13} strokeWidth={2.5} className="text-yellow-500" />
            <span className="font-light">Double-click to edit. Escape to cancel.</span>
          </p>
        ) : null}
        {data ? <CategoryList categories={data} onCategoryDelete={() => refetch()} /> : null}
      </div>
    </div>
  );
};
