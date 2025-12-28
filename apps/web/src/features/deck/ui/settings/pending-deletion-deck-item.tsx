"use client";

import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Eye, EyeOff, Loader2, RotateCcw } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

import { api } from "@/trpc/react";

type PendingDeletionDeckItemProps = {
  deck: DeckDto;
  onRestore: () => void;
};

const formatTimeRemaining = (deletionDate: Date): string => {
  const now = new Date();
  const diff = deletionDate.getTime() - now.getTime();

  if (diff <= 0) {
    return "Being deleted...";
  }

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} remaining`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours !== 1 ? "s" : ""} remaining`;
};

export const PendingDeletionDeckItem: FC<PendingDeletionDeckItemProps> = ({ deck, onRestore }) => {
  const [errorResponse, setErrorResponse] = useState("");

  const { mutate: restoreDeck, isPending } = api.decks.restoreDeck.useMutation({
    onSuccess: () => {
      onRestore();
    },
    onError: (error) => {
      setErrorResponse(error.message);
    },
  });

  const handleRestore = () => {
    setErrorResponse("");
    restoreDeck({ deckId: deck.id });
  };

  return (
    <div className="flex min-h-[48px] items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-amber-800 line-through">{deck.name}</span>
          <Badge variant={deck.isPublic ? "default" : "secondary"} className="gap-1 text-xs opacity-60">
            {deck.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
            {deck.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        <span className="text-amber-600 text-xs">
          {deck.scheduledForDeletionAt ? formatTimeRemaining(new Date(deck.scheduledForDeletionAt)) : "Pending..."}
        </span>
        {errorResponse ? <span className="text-red-600 text-xs">{errorResponse}</span> : null}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={isPending}
        className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
        Restore
      </Button>
    </div>
  );
};
