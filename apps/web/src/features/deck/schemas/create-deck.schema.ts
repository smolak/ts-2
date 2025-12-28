import { deckMetadataSchema } from "@repo/deck/schemas/deck-metadata.schema";
import { deckNameSchema } from "@repo/deck/schemas/deck-name.schema";
import { deckSlugSchema } from "@repo/deck/schemas/deck-slug.schema";
import { z } from "zod";

export const createDeckSchema = z.object({
  name: deckNameSchema,
  slug: deckSlugSchema,
  metadata: deckMetadataSchema.optional(),
  isPublic: z.boolean(),
});

export type CreateDeckSchema = z.infer<typeof createDeckSchema>;
