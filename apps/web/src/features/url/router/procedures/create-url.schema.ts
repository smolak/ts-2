import { categoryIdSchema } from "@workspace/category/id/category-id.schema";
import { urlSchema } from "@workspace/url/url/url.schema";
import { z } from "zod";

export type CreateUrlSchema = z.infer<typeof createUrlSchema>;

export const createUrlSchema = z.object({
  url: urlSchema,
  categoryIds: z.array(categoryIdSchema).default([]),
});
