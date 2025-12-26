"use client";

import { DECK_LIMITS } from "@repo/deck/config/deck-limits";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { Progress } from "@repo/ui/components/progress";
import { ArrowUpRight, Eye, EyeOff, Layers } from "lucide-react";
import type { FC } from "react";

type DeckLimitsUsageProps = {
  decks: ReadonlyArray<DeckDto>;
};

export const DeckLimitsUsage: FC<DeckLimitsUsageProps> = ({ decks }) => {
  // TODO: Get user's actual plan from API when available
  const userPlan = "free" as const;
  const limits = DECK_LIMITS[userPlan];

  const publicCount = decks.filter((d) => d.isPublic).length;
  const privateCount = decks.filter((d) => !d.isPublic).length;
  const totalCount = decks.length;

  const isAtPublicLimit = publicCount >= limits.maxPublicDecks;
  const isAtPrivateLimit = privateCount >= limits.maxPrivateDecks;
  const isAtTotalLimit = totalCount >= limits.maxTotalDecks;

  const publicProgress = (publicCount / limits.maxPublicDecks) * 100;
  const privateProgress = (privateCount / limits.maxPrivateDecks) * 100;
  const totalProgress = (totalCount / limits.maxTotalDecks) * 100;

  const showUpgradePrompt = isAtPublicLimit || isAtPrivateLimit || isAtTotalLimit;

  return (
    <div className="flex flex-col gap-4 rounded-md border bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Deck Usage</h4>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600 text-xs capitalize">{userPlan} plan</span>
      </div>

      <div className="grid gap-3 text-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Eye size={12} className="text-green-600" />
              Public Decks
            </span>
            <span className={isAtPublicLimit ? "font-medium text-amber-600" : "text-slate-500"}>
              {publicCount} / {limits.maxPublicDecks}
            </span>
          </div>
          <Progress value={publicProgress} className="h-1.5" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <EyeOff size={12} className="text-slate-500" />
              Private Decks
            </span>
            <span className={isAtPrivateLimit ? "font-medium text-amber-600" : "text-slate-500"}>
              {privateCount} / {limits.maxPrivateDecks}
            </span>
          </div>
          <Progress value={privateProgress} className="h-1.5" />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Layers size={12} />
              Total Decks
            </span>
            <span className={isAtTotalLimit ? "font-medium text-amber-600" : "text-slate-500"}>
              {totalCount} / {limits.maxTotalDecks}
            </span>
          </div>
          <Progress value={totalProgress} className="h-1.5" />
        </div>
      </div>

      {showUpgradePrompt ? (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <span className="text-amber-700 text-sm">
            {isAtTotalLimit
              ? "You've reached your deck limit"
              : isAtPublicLimit
                ? "You've reached your public deck limit"
                : "You've reached your private deck limit"}
          </span>
          <button
            type="button"
            className="flex items-center gap-1 font-medium text-amber-700 text-sm hover:text-amber-800 hover:underline"
          >
            Upgrade
            <ArrowUpRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
};
