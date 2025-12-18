import { z } from "zod";

export const DECK_NAME_MAX_LENGTH = 50;

export const deckNameSchema = z
  .string()
  .trim()
  .min(1, "Deck name is required.")
  .max(DECK_NAME_MAX_LENGTH, `Deck name cannot exceed ${DECK_NAME_MAX_LENGTH} characters.`);

