import { deckIdSchema } from "@repo/db/id/deck-id";
import type { TagId } from "@repo/db/id/tag-id";
import { z } from "zod";
import { tagNameSchema } from "../../name/tag-name.schema";

export type AddTagBody = z.infer<typeof addTagBodySchema>;

export const addTagBodySchema = z.object({
  deckId: deckIdSchema,
  name: tagNameSchema,
});

export type AddTagSuccessResponse = { success: true; tagId?: TagId };
