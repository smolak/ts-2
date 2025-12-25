import { deckIdSchema } from "@repo/db/id/deck-id";
import { deckMetadataSchema } from "@repo/deck/schemas/deck-metadata.schema";
import { deckNameSchema } from "@repo/deck/schemas/deck-name.schema";
import { deckSlugSchema } from "@repo/deck/schemas/deck-slug.schema";
import { z } from "zod";

export const updateDeckSchema = z.object({
  deckId: deckIdSchema,
  name: deckNameSchema.optional(),
  slug: deckSlugSchema.optional(),
  metadata: deckMetadataSchema.optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDeckSchema = z.infer<typeof updateDeckSchema>;

