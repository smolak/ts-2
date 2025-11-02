import type { TagDto } from "@repo/tag/dto/tag.dto";
import { create } from "zustand";

interface TagsState {
  tags: TagDto[];
  shouldRefetchTags: boolean;
  refetchTags: () => void;
  setShouldRefetchTags: (value: boolean) => void;
  setTags: (tags: TagDto[]) => void;
}

export const useTagsStore = create<TagsState>()((set) => ({
  tags: [],
  setTags: (tags) => set({ tags: tags }),
  shouldRefetchTags: false,
  setShouldRefetchTags: (value) => set(() => ({ shouldRefetchTags: value })),
  refetchTags: () => set({ shouldRefetchTags: true }),
}));
