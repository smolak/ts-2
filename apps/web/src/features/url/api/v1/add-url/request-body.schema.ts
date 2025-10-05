import { categoryIdSchema } from "@repo/db/id/category-id";
import { metadataSchema } from "@repo/metadata-scrapper/metadata.schema";
import { z } from "zod";

export const addUrlRequestBodySchema = z.object({
  metadata: metadataSchema,
  categoryIds: z.array(categoryIdSchema).default([]),
});

export type AddUrlRequestBody = z.infer<typeof addUrlRequestBodySchema>;
