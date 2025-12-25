import { deckIdSchema } from "@repo/db/id/deck-id";
import { z } from "zod";

export const restoreDeckSchema = z.object({
  deckId: deckIdSchema,
});

export type RestoreDeckSchema = z.infer<typeof restoreDeckSchema>;

