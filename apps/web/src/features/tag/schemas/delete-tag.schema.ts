import { tagIdSchema } from "@repo/db/id/tag-id";
import { z } from "zod";

export const deleteTagSchema = z.object({
  id: tagIdSchema,
});

export type DeleteTagSchema = z.infer<typeof deleteTagSchema>;
