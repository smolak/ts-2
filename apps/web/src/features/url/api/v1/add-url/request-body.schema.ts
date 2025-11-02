import { tagIdSchema } from "@repo/db/id/tag-id";
import { metadataSchema } from "@repo/metadata-scrapper/metadata.schema";
import { z } from "zod";

export const addUrlRequestBodySchema = z.object({
  metadata: metadataSchema,
  tagIds: z.array(tagIdSchema).default([]),
});

export type AddUrlRequestBody = z.infer<typeof addUrlRequestBodySchema>;
