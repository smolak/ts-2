"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Input } from "@repo/ui/components/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { AlertTriangle, Trash } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "@/trpc/react";

import {
  type ScheduleDeckDeletionInput,
  type ScheduleDeckDeletionSchema,
  scheduleDeckDeletionSchema,
} from "../../schemas/schedule-deck-deletion.schema";
import { ActionPending } from "./action-pending";
import { CancelAction } from "./cancel-action";
import { StickyErrorMessage } from "./sticky-error-message";
import { SubmitButton } from "./submit-button";

type DeleteDeckProps = {
  deck: DeckDto;
  onDelete: () => void;
  onCancel: () => void;
};

export const DeleteDeck: FC<DeleteDeckProps> = ({ deck, onDelete, onCancel }) => {
  const [errorResponse, setErrorResponse] = useState("");
  const { register, handleSubmit } = useForm<ScheduleDeckDeletionInput, unknown, ScheduleDeckDeletionSchema>({
    resolver: zodResolver(scheduleDeckDeletionSchema),
    mode: "onChange",
    defaultValues: {
      deckId: deck.id,
    },
  });

  const { mutate: scheduleDeletion, isPending } = api.decks.scheduleDeckDeletion.useMutation({
    onSuccess: () => {
      onDelete();
    },
    onError: (error) => {
      setErrorResponse(error.message);
    },
  });

  const abort = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    document.addEventListener("keyup", abort);

    return () => {
      document.removeEventListener("keyup", abort);
    };
  }, [abort]);

  const onSubmit = (data: ScheduleDeckDeletionSchema) => {
    setErrorResponse("");
    scheduleDeletion(data);
  };

  return (
    <form className="relative" onSubmit={handleSubmit(onSubmit)}>
      <p className="absolute -top-8 rounded-md border-amber-600 border-l-4 bg-amber-50 px-2 py-1 text-amber-700 text-sm">
        <span className="flex items-center gap-2">
          <AlertTriangle size={13} strokeWidth={2.5} />
          <span className="font-light">Deck will be scheduled for deletion. You have 30 minutes to restore it.</span>
        </span>
      </p>
      <div
        className={cn(
          "space-between flex min-h-[48px] items-center justify-between rounded-md border border-red-100 px-2 py-2 text-accent-foreground shadow-sm transition-all",
          { "rounded-bl-none border-red-50": Boolean(errorResponse) },
        )}
      >
        <div className="flex flex-col gap-1">
          <span className="font-medium">{deck.name}</span>
          <span className="text-slate-500 text-xs">/{deck.slug}</span>
          {deck.urlsCount > 0 || deck.followersCount > 0 ? (
            <span className="text-slate-500 text-xs">
              {deck.urlsCount} URL{deck.urlsCount !== 1 ? "s" : ""} • {deck.followersCount} follower
              {deck.followersCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        <div className="flex text-gray-600">
          {isPending ? (
            <ActionPending />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SubmitButton isSubmitting={isPending} className="group hover:bg-red-100">
                    <Trash size={14} className="group-hover:text-red-600" />
                  </SubmitButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Yes, delete!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CancelAction actionPending={isPending} onCancelAction={onCancel} />
              </TooltipTrigger>
              <TooltipContent>
                <p>No, I changed my mind.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Input {...register("deckId")} type="hidden" />
      </div>
      {errorResponse !== "" ? <StickyErrorMessage>{errorResponse}</StickyErrorMessage> : null}
    </form>
  );
};
