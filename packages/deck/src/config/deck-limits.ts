import type { UserPlan } from "@repo/db/types";

export const DECK_LIMITS = {
  free: {
    maxPublicDecks: 3,
    maxPrivateDecks: 1,
    maxTotalDecks: 4,
  },
  medium: {
    maxPublicDecks: 10,
    maxPrivateDecks: 5,
    maxTotalDecks: 15,
  },
  pro: {
    maxPublicDecks: Number.POSITIVE_INFINITY,
    maxPrivateDecks: Number.POSITIVE_INFINITY,
    maxTotalDecks: Number.POSITIVE_INFINITY,
  },
} as const;

export type DeckLimits = (typeof DECK_LIMITS)[UserPlan];

export const getDeckLimits = (plan: UserPlan): DeckLimits => DECK_LIMITS[plan];

export type CanCreateDeckResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export const canCreateDeck = (
  plan: UserPlan,
  currentPublicCount: number,
  currentPrivateCount: number,
  isPublic: boolean
): CanCreateDeckResult => {
  const limits = getDeckLimits(plan);
  const currentTotal = currentPublicCount + currentPrivateCount;

  if (currentTotal >= limits.maxTotalDecks) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.maxTotalDecks} decks on the ${plan} plan.`,
    };
  }

  if (isPublic && currentPublicCount >= limits.maxPublicDecks) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.maxPublicDecks} public decks on the ${plan} plan.`,
    };
  }

  if (!isPublic && currentPrivateCount >= limits.maxPrivateDecks) {
    return {
      allowed: false,
      reason: `You've reached the maximum of ${limits.maxPrivateDecks} private decks on the ${plan} plan.`,
    };
  }

  return { allowed: true };
};

export type CanChangeDeckVisibilityResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export const canChangeDeckVisibility = (
  plan: UserPlan,
  currentPublicCount: number,
  currentPrivateCount: number,
  currentlyPublic: boolean,
  newIsPublic: boolean
): CanChangeDeckVisibilityResult => {
  if (currentlyPublic === newIsPublic) {
    return { allowed: true };
  }

  const limits = getDeckLimits(plan);

  if (newIsPublic) {
    // Private → Public: Check public limit (subtract 1 from private since we're moving it)
    if (currentPublicCount >= limits.maxPublicDecks) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${limits.maxPublicDecks} public decks on the ${plan} plan.`,
      };
    }
  } else {
    // Public → Private: Check private limit (subtract 1 from public since we're moving it)
    if (currentPrivateCount >= limits.maxPrivateDecks) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${limits.maxPrivateDecks} private decks on the ${plan} plan.`,
      };
    }
  }

  return { allowed: true };
};

