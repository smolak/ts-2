import { z } from "zod";
import { categoryIdSchema } from "@workspace/category/id/category-id.schema";
import { getSchema } from "@workspace/metadata/compression";

const metadataSchema = getSchema("v1");

export const addUrlRequestBodySchema = z.object({
  metadata: metadataSchema,
  categoryIds: z.array(categoryIdSchema).default([]),
});

export type AddUrlRequestBody = z.infer<typeof addUrlRequestBodySchema>;
