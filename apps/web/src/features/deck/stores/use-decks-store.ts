import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { create } from "zustand";

interface DecksState {
  decks: DeckDto[];
  shouldRefetchDecks: boolean;
  refetchDecks: () => void;
  setShouldRefetchDecks: (value: boolean) => void;
  setDecks: (decks: DeckDto[]) => void;
}

export const useDecksStore = create<DecksState>()((set) => ({
  decks: [],
  setDecks: (decks) => set({ decks }),
  shouldRefetchDecks: false,
  setShouldRefetchDecks: (value) => set(() => ({ shouldRefetchDecks: value })),
  refetchDecks: () => set({ shouldRefetchDecks: true }),
}));
