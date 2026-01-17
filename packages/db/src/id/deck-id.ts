import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const DECK_ID_PREFIX = "deck_" as const;
export const DECK_ID_LENGTH = DEFAULT_ID_LENGTH + DECK_ID_PREFIX.length;

/**
 * Branded type for Deck IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `DeckId` is expected.
 */
declare const DeckIdBrand: unique symbol;
export type DeckId = string & { readonly [DeckIdBrand]: typeof DeckIdBrand };

export const generateDeckId = (): DeckId => generateId(DECK_ID_PREFIX) as DeckId;

export const deckIdSchema = z
  .string()
  .trim()
  .startsWith(DECK_ID_PREFIX, { message: "ID passed is not a deck ID." })
  .length(DECK_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is DeckId => true);
