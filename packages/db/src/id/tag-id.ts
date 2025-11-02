import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const TAG_ID_PREFIX = "tag_";
export const TAG_ID_LENGTH = DEFAULT_ID_LENGTH + TAG_ID_PREFIX.length;

export const generateTagId = () => generateId(TAG_ID_PREFIX);

export type TagId = z.infer<typeof tagIdSchema>;

export const tagIdSchema = z
  .string()
  .trim()
  .startsWith(TAG_ID_PREFIX, { message: "ID passed is not a tag ID." })
  .length(TAG_ID_PREFIX.length + DEFAULT_ID_LENGTH, { message: "Wrong ID size." });
