import type { DeckDto } from "@repo/deck/dto/deck.dto";
import type { FC } from "react";

import { DeckPickerList } from "./deck-picker-list";

type DeckPickerProps = {
  decks: ReadonlyArray<DeckDto>;
  selectedDeckIds: DeckDto["id"][];
  onDeckSelectionChange: (id: DeckDto["id"]) => void;
  description: string;
};

export const DeckPicker: FC<DeckPickerProps> = ({ decks, selectedDeckIds, onDeckSelectionChange, description }) => {
  const deckPickerDecks = decks.map((deck) => {
    return {
      ...deck,
      selected: selectedDeckIds.indexOf(deck.id) >= 0,
    };
  });

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h3 className="font-light text-slate-400 text-xs">{description}</h3>
      </header>
      <DeckPickerList decks={deckPickerDecks} onDeckSelectionChange={onDeckSelectionChange} />
    </section>
  );
};
