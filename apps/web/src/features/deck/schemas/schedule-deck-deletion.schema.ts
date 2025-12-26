import { deckIdSchema } from "@repo/db/id/deck-id";
import { z } from "zod";

export const scheduleDeckDeletionSchema = z.object({
  deckId: deckIdSchema,
});

export type ScheduleDeckDeletionSchema = z.infer<typeof scheduleDeckDeletionSchema>;
