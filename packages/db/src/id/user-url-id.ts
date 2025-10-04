import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const USER_URL_ID_PREFIX = "user_url_";
export const USER_URL_ID_LENGTH = DEFAULT_ID_LENGTH + USER_URL_ID_PREFIX.length;

export const generateUserUrlId = () => generateId(USER_URL_ID_PREFIX);

export type UserUrlId = z.infer<typeof userUrlIdSchema>;

export const userUrlIdSchema = z
  .string()
  .trim()
  .startsWith(USER_URL_ID_PREFIX, { message: "ID passed is not a userUrl ID." })
  .length(USER_URL_ID_LENGTH, { message: "Wrong ID size." });
