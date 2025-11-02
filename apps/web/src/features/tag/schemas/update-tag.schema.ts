import { tagIdSchema } from "@repo/db/id/tag-id";
import { tagNameSchema } from "@repo/tag/name/tag-name.schema";
import { z } from "zod";

export const updateTagSchema = z.object({
  id: tagIdSchema,
  name: tagNameSchema,
});

export type UpdateTagSchema = z.infer<typeof updateTagSchema>;
