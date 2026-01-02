"use client";

import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Badge } from "@repo/ui/components/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { Eye, EyeOff, Link2, Pencil, Trash2, Users } from "lucide-react";
import { type FC, useEffect, useState } from "react";

import { ActionButton } from "./action-button";
import { DeleteDeck } from "./delete-deck";
import { EditDeck } from "./edit-deck";

type DeckListItemProps = {
  deck: DeckDto;
  onDeckChange: () => void;
};

type CrudState = "idle" | "edit" | "delete";

export const DeckListItem: FC<DeckListItemProps> = ({ deck, onDeckChange }) => {
  const [deckData, setDeckData] = useState(deck);
  const [state, setState] = useState<CrudState>("idle");

  // Sync local state when prop changes (e.g., after refetch)
  useEffect(() => {
    setDeckData(deck);
  }, [deck]);

  if (state === "edit") {
    return (
      <EditDeck
        deck={deckData}
        onSave={(updatedDeck) => {
          setDeckData(updatedDeck);
          setState("idle");
        }}
        onCancel={() => setState("idle")}
      />
    );
  }

  if (state === "delete") {
    return <DeleteDeck deck={deckData} onDelete={onDeckChange} onCancel={() => setState("idle")} />;
  }

  return (
    <div className="space-between flex min-h-[48px] items-center justify-between rounded-md border border-transparent px-2 py-1 transition-all hover:bg-slate-50">
      <button
        type="button"
        className="flex w-full flex-col items-start gap-1 text-left"
        onClick={() => setState("edit")}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{deckData.name}</span>
          <Badge variant={deckData.isPublic ? "default" : "secondary"} className="gap-1 text-xs">
            {deckData.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
            {deckData.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <span className="flex items-center gap-1" title="Number of URLs in this deck">
            <Link2 size={12} />
            {deckData.urlsCount}
          </span>
          {deckData.isPublic ? (
            <span className="flex items-center gap-1" title="Number of followers">
              <Users size={12} />
              {deckData.followersCount}
            </span>
          ) : null}
          <span className="text-slate-400">/{deckData.slug}</span>
        </div>
      </button>
      <span className="flex text-gray-600">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton onClick={() => setState("edit")} className="group hover:bg-sky-100">
                <Pencil size={14} className="group-hover:text-sky-600" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit deck</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton onClick={() => setState("delete")} className="group hover:bg-red-100">
                <Trash2 size={14} className="group-hover:text-red-600" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete?</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    </div>
  );
};
