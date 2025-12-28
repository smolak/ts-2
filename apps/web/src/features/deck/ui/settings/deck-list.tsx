import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { AlertTriangle } from "lucide-react";
import type { FC } from "react";

import { DeckListItem } from "./deck-list-item";
import { PendingDeletionDeckItem } from "./pending-deletion-deck-item";

type DeckListProps = {
  decks: ReadonlyArray<DeckDto>;
  pendingDeletionDecks: ReadonlyArray<DeckDto>;
  onDeckChange: () => void;
};

export const DeckList: FC<DeckListProps> = ({ decks, pendingDeletionDecks, onDeckChange }) => {
  return (
    <div className="flex flex-col gap-4">
      {decks.length === 0 && pendingDeletionDecks.length === 0 ? (
        <p className="py-8 text-center text-slate-500">
          No decks yet. Create your first deck to start organizing your links!
        </p>
      ) : null}

      {decks.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {decks.map((deck) => (
            <li key={deck.id}>
              <DeckListItem deck={deck} onDeckChange={onDeckChange} />
            </li>
          ))}
        </ol>
      ) : null}

      {pendingDeletionDecks.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertTriangle size={14} />
            <span className="font-medium">Pending deletion</span>
          </p>
          <ol className="flex flex-col gap-2">
            {pendingDeletionDecks.map((deck) => (
              <li key={deck.id}>
                <PendingDeletionDeckItem deck={deck} onRestore={onDeckChange} />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
};
