import { z } from "zod";

export const DECK_DESCRIPTION_MAX_LENGTH = 500;

export const deckMetadataSchema = z.object({
  description: z
    .string()
    .trim()
    .max(DECK_DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${DECK_DESCRIPTION_MAX_LENGTH} characters.`)
    .optional()
    .nullable(),
  imageUrl: z.url("Invalid image URL.").optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733).")
    .optional()
    .nullable(),
});

export type DeckMetadata = z.infer<typeof deckMetadataSchema>;
