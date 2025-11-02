import { tagNameSchema } from "@repo/tag/name/tag-name.schema";
import { z } from "zod";

export const createTagSchema = z.object({
  name: tagNameSchema,
});

export type CreateTagSchema = z.infer<typeof createTagSchema>;
