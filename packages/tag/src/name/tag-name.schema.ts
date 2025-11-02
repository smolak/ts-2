import { z } from "zod";

export const TAG_NAME_MAX_LENGTH = 30;

export const tagNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(TAG_NAME_MAX_LENGTH)
  .refine((val) => !val.includes(","), {
    message: `Tag name can't include comma "," character.`,
  });
