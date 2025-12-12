import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const DECK_ID_PREFIX = "deck_";
export const DECK_ID_LENGTH = DEFAULT_ID_LENGTH + DECK_ID_PREFIX.length;

export const generateDeckId = () => generateId(DECK_ID_PREFIX);

export type DeckId = z.infer<typeof deckIdSchema>;

export const deckIdSchema = z
  .string()
  .trim()
  .startsWith(DECK_ID_PREFIX, { message: "ID passed is not a deck ID." })
  .length(DECK_ID_PREFIX.length + DEFAULT_ID_LENGTH, { message: "Wrong ID size." });

