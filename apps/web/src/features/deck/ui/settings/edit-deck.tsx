"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { ColorPicker } from "@repo/ui/components/color-picker";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { AlertTriangle, Eye, EyeOff, Info, Save } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { api } from "@/trpc/react";

import { type UpdateDeckSchema, updateDeckSchema } from "../../schemas/update-deck.schema";
import { ActionPending } from "./action-pending";
import { CancelAction } from "./cancel-action";
import { StickyErrorMessage } from "./sticky-error-message";
import { SubmitButton } from "./submit-button";

type EditDeckProps = {
  deck: DeckDto;
  onSave: (updatedDeck: DeckDto) => void;
  onCancel: () => void;
};

export const EditDeck: FC<EditDeckProps> = ({ deck, onSave, onCancel }) => {
  const [errorResponse, setErrorResponse] = useState("");
  const {
    control,
    register,
    setFocus,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UpdateDeckSchema>({
    resolver: zodResolver(updateDeckSchema),
    mode: "onChange",
    defaultValues: {
      deckId: deck.id,
      name: deck.name,
      slug: deck.slug,
      isPublic: deck.isPublic,
      metadata: {
        color: deck.metadata?.color ?? null,
      },
    },
  });

  const isPublic = watch("isPublic");

  // Track visibility changes
  const isBeingMadePrivate = deck.isPublic && isPublic === false;
  const isBeingMadePublic = !deck.isPublic && isPublic === true;
  const hasFollowers = deck.followersCount > 0;
  const showPrivacyWarning = isBeingMadePrivate && hasFollowers;

  const { mutate: updateDeck, isPending } = api.decks.updateDeck.useMutation({
    onSuccess: (data) => {
      onSave({
        ...deck,
        name: data.name,
        slug: data.slug,
        isPublic: data.isPublic,
        metadata: data.metadata ?? deck.metadata,
      });
    },
    onError: (error) => {
      setErrorResponse(error.message);
    },
  });

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  useEffect(() => {
    if (errorResponse !== "") {
      setFocus("name");
    }
  }, [setFocus, errorResponse]);

  const onSubmit = (data: UpdateDeckSchema) => {
    setErrorResponse("");
    updateDeck(data);
  };

  const hasErrors = Boolean(errors?.name?.message || errors?.slug?.message || errorResponse);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <div
        className={cn("flex flex-col gap-3 rounded-md border p-3 text-accent-foreground shadow-sm transition-all", {
          "rounded-bl-none border-red-200": hasErrors,
        })}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="name" className="text-slate-500 text-xs">
                Name
              </Label>
              <Input
                {...register("name")}
                id="name"
                className="h-8"
                type="text"
                inputMode="text"
                disabled={isPending}
                onKeyUp={({ key }) => {
                  if (key === "Escape") {
                    onCancel();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="slug" className="text-slate-500 text-xs">
                URL Slug
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-sm">/</span>
                <Input
                  {...register("slug")}
                  id="slug"
                  className="h-8 font-mono"
                  type="text"
                  inputMode="text"
                  disabled={isPending}
                  onKeyUp={({ key }) => {
                    if (key === "Escape") {
                      onCancel();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Controller
                  name="isPublic"
                  control={control}
                  render={({ field }) => (
                    <Switch id="isPublic" checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                  )}
                />
                <Label htmlFor="isPublic" className="flex cursor-pointer items-center gap-1 text-sm">
                  {isPublic ? (
                    <>
                      <Eye size={12} className="text-green-600" />
                      Public
                    </>
                  ) : (
                    <>
                      <EyeOff size={12} className="text-slate-500" />
                      Private
                    </>
                  )}
                </Label>
              </div>
              {showPrivacyWarning ? (
                <p className="flex items-start gap-2 rounded-md border-amber-600 border-l-4 bg-amber-50 px-2 py-1.5 text-amber-700 text-xs">
                  <AlertTriangle size={14} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  <span>
                    Making this deck private will remove{" "}
                    <strong>
                      {deck.followersCount} follower{deck.followersCount !== 1 ? "s" : ""}
                    </strong>
                    . They won't be notified. URLs already in their feeds will remain.
                  </span>
                </p>
              ) : null}
              {isBeingMadePublic ? (
                <p className="flex items-start gap-2 rounded-md border-sky-500 border-l-4 bg-sky-50 px-2 py-1.5 text-sky-700 text-xs">
                  <Info size={14} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  <span>This deck will be visible on your profile and others can follow it.</span>
                </p>
              ) : null}
            </div>
            <Controller
              name="metadata.color"
              control={control}
              render={({ field }) => (
                <ColorPicker value={field.value} onChange={field.onChange} disabled={isPending} label="Deck Color" />
              )}
            />
          </div>

          <div className="ml-4 flex flex-col text-gray-600">
            {isPending ? (
              <ActionPending />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SubmitButton isSubmitting={isPending} className="group hover:bg-green-100">
                      <Save size={14} className="group-hover:text-green-600" />
                    </SubmitButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save changes</p>
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
                  <p>Discard changes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <input {...register("deckId")} type="hidden" />
      </div>
      {hasErrors ? (
        <StickyErrorMessage>{errors?.name?.message || errors?.slug?.message || errorResponse}</StickyErrorMessage>
      ) : null}
    </form>
  );
};
