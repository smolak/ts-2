import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const USER_ID_PREFIX = "user_" as const;
export const USER_ID_LENGTH = DEFAULT_ID_LENGTH + USER_ID_PREFIX.length;

export const generateUserId = (): string => generateId(USER_ID_PREFIX);

export type UserId = z.infer<typeof userIdSchema>;

export const userIdSchema = z
  .string()
  .trim()
  .startsWith(USER_ID_PREFIX, { message: "ID passed is not a user ID." })
  .length(USER_ID_LENGTH, { message: "Wrong ID size." });
