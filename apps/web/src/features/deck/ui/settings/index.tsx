"use client";

import { Lightbulb } from "lucide-react";
import type { FC } from "react";

import { api } from "@/trpc/react";

import { CreateDeck } from "./create-deck";
import { DeckLimitsUsage } from "./deck-limits-usage";
import { DeckList } from "./deck-list";
import { ErrorLoadingDecks } from "./error-loading-decks";
import { LoadingDecks } from "./loading-decks";

export const DecksSettings: FC = () => {
  const { data, isLoading, isError, refetch } = api.decks.getUserDecks.useQuery();
  const { data: userProfile, isLoading: isProfileLoading } = api.userProfiles.getPrivateUserProfile.useQuery();

  if (isLoading || isProfileLoading) {
    return <LoadingDecks />;
  }

  if (isError) {
    return <ErrorLoadingDecks />;
  }

  const activeDecks = data?.filter((deck) => !deck.scheduledForDeletionAt) ?? [];
  const pendingDeletionDecks = data?.filter((deck) => deck.scheduledForDeletionAt) ?? [];
  const userPlan = userProfile?.plan ?? "free";

  return (
    <div className="flex flex-col gap-6 md:max-w-[550px]">
      <DeckLimitsUsage decks={activeDecks} userPlan={userPlan} />
      <CreateDeck onDeckCreated={() => refetch()} />
      <div className="flex flex-col gap-2">
        {activeDecks.length > 0 ? (
          <p className="flex items-center gap-2 rounded-md border-yellow-500 border-l-4 bg-slate-50 px-2 py-1 text-slate-600 text-sm">
            <Lightbulb size={13} strokeWidth={2.5} className="text-yellow-500" />
            <span className="font-light">Click on a deck to edit. Escape to cancel.</span>
          </p>
        ) : null}
        {data ? (
          <DeckList decks={activeDecks} pendingDeletionDecks={pendingDeletionDecks} onDeckChange={() => refetch()} />
        ) : null}
      </div>
    </div>
  );
};
