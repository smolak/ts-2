import { z } from "zod";
import { tagNameSchema } from "../../name/tag-name.schema";

export type AddTagBody = z.infer<typeof addTagBodySchema>;

export const addTagBodySchema = z.object({
  name: tagNameSchema,
});

export type AddTagSuccessResponse = { success: true };
