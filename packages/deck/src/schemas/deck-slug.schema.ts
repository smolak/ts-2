import { z } from "zod";

export const DECK_SLUG_MAX_LENGTH = 50;
export const DECK_SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789-";

export const deckSlugSchema = z
  .string()
  .trim()
  .min(1, "Deck slug is required.")
  .max(DECK_SLUG_MAX_LENGTH, `Slug cannot exceed ${DECK_SLUG_MAX_LENGTH} characters.`)
  .regex(new RegExp(`^[${DECK_SLUG_ALPHABET}]+$`), "Slug can only contain lowercase letters, numbers, and hyphens.")
  .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), {
    message: "Slug cannot start or end with a hyphen.",
  });

