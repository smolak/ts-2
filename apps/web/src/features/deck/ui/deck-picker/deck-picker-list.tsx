import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Checkbox } from "@repo/ui/components/checkbox";
import { cn } from "@repo/ui/lib/utils";
import type { FC } from "react";

type DeckPickerDeck = Pick<DeckDto, "id" | "name" | "urlsCount" | "isPublic"> & { selected: boolean };

type DeckPickerListProps = {
  className?: string;
  decks: ReadonlyArray<DeckPickerDeck>;
  onDeckSelectionChange: (id: DeckDto["id"]) => void;
};

export const DeckPickerList: FC<DeckPickerListProps> = ({ className, decks, onDeckSelectionChange }) => {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {decks.map(({ id, name, urlsCount, isPublic, selected }) => {
        return (
          <li className="flex items-center space-x-2" key={id}>
            <Checkbox
              id={id}
              className="scale-85 border-slate-800"
              checked={selected}
              onCheckedChange={() => onDeckSelectionChange(id)}
            />
            <label
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <span>{name}</span>
              {!isPublic ? (
                <span title="Private deck" className="text-slate-400 text-xs">
                  (private)
                </span>
              ) : null}
              {urlsCount > 0 ? (
                <span title="Number of URLs in this deck" className="font-extralight text-slate-600">
                  ({urlsCount})
                </span>
              ) : null}
            </label>
          </li>
        );
      })}
    </ul>
  );
};
