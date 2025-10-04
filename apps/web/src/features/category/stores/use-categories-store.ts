import type { CategoryDto } from "@repo/category/dto/category.dto";
import { create } from "zustand";

interface CategoriesState {
  categories: CategoryDto[];
  shouldRefetchCategories: boolean;
  refetchCategories: () => void;
  setShouldRefetchCategories: (value: boolean) => void;
  setCategories: (categories: CategoryDto[]) => void;
}

export const useCategoriesStore = create<CategoriesState>()((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  shouldRefetchCategories: false,
  setShouldRefetchCategories: (value) => set(() => ({ shouldRefetchCategories: value })),
  refetchCategories: () => set({ shouldRefetchCategories: true }),
}));
