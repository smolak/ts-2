"use client";

import type { DeckId } from "@repo/db/id/deck-id";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Layers } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FC, useCallback } from "react";

type DeckSelectorProps = {
  decks: ReadonlyArray<DeckDto>;
};

const getSelectedDeck = (decks: ReadonlyArray<DeckDto>, searchParams: URLSearchParams): DeckId | null => {
  const deckId = searchParams.get("deck");

  if (!deckId) {
    return null;
  }

  // Verify the deck exists in our list (also validates the deckId format implicitly)
  const deck = decks.find((d) => d.id === deckId);
  return deck?.id ?? null;
};

export const DeckSelector: FC<DeckSelectorProps> = ({ decks }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedDeckId = getSelectedDeck(decks, searchParams);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

  const onDeckChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);

      if (value === "all") {
        params.delete("deck");
      } else {
        params.set("deck", value);
      }

      if (params.toString() === "") {
        router.push(pathname);
      } else {
        router.push(`${pathname}?${decodeURIComponent(params.toString())}`);
      }
    },
    [pathname, router, searchParams],
  );

  // Only show active (non-deleted) decks
  const activeDecks = decks.filter((deck) => deck.scheduledForDeletionAt === null);

  const buttonLabel = selectedDeck ? selectedDeck.name : "All Decks";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px]">
          <Layers size={16} className="mr-2" />
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {activeDecks.length > 0 ? (
          <DropdownMenuRadioGroup value={selectedDeckId ?? "all"} onValueChange={onDeckChange}>
            <DropdownMenuRadioItem value="all" className="cursor-pointer">
              All Decks
            </DropdownMenuRadioItem>
            <DropdownMenuSeparator />
            {activeDecks.map((deck) => (
              <DropdownMenuRadioItem key={deck.id} value={deck.id} className="cursor-pointer">
                <span className="flex items-center gap-2">
                  {deck.name}
                  {!deck.isPublic && <span className="text-slate-400 text-xs">(private)</span>}
                  {deck.urlsCount > 0 && <span>({deck.urlsCount})</span>}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        ) : (
          <p className="p-2 text-slate-500 text-sm">No decks yet</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
