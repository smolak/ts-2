import type { DeckId } from "@repo/db/id/deck-id";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Settings } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

import { DeckPickerList } from "./deck-picker-list";

type DeckPickerProps = {
  decks: ReadonlyArray<DeckDto>;
  selectedDeckIds: DeckId[];
  onDeckSelectionChange: (id: DeckId) => void;
  description: string;
  showSettingsLink?: boolean;
};

export const DeckPicker: FC<DeckPickerProps> = ({
  decks,
  selectedDeckIds,
  onDeckSelectionChange,
  description,
  showSettingsLink = true,
}) => {
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
        {showSettingsLink ? (
          <span className="flex items-center gap-2">
            <Link href="/settings/decks" className="cursor-pointer rounded p-1.5 hover:bg-slate-100">
              <Settings size={14} className="text-slate-400" />
            </Link>
          </span>
        ) : null}
      </header>
      {decks.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No decks yet.{" "}
          <Link href="/settings/decks" className="text-primary underline">
            Create one
          </Link>{" "}
          to organize your links.
        </p>
      ) : (
        <DeckPickerList decks={deckPickerDecks} onDeckSelectionChange={onDeckSelectionChange} />
      )}
    </section>
  );
};
