import { deckIdSchema } from "@repo/db/id/deck-id";
import { tagIdSchema } from "@repo/db/id/tag-id";
import { metadataSchema } from "@repo/metadata-scrapper/metadata.schema";
import { z } from "zod";

export const addUrlRequestBodySchema = z.object({
  metadata: metadataSchema,
  deckId: deckIdSchema,
  tagIds: z.array(tagIdSchema).default([]),
});

export type AddUrlRequestBody = z.infer<typeof addUrlRequestBodySchema>;
