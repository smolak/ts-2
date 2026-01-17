import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const USER_ID_PREFIX = "user_" as const;
export const USER_ID_LENGTH = DEFAULT_ID_LENGTH + USER_ID_PREFIX.length;

/**
 * Branded type for User IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `UserId` is expected.
 */
declare const UserIdBrand: unique symbol;
export type UserId = string & { readonly [UserIdBrand]: typeof UserIdBrand };

export const generateUserId = (): UserId => generateId(USER_ID_PREFIX) as UserId;

export const userIdSchema = z
  .string()
  .trim()
  .startsWith(USER_ID_PREFIX, { message: "ID passed is not a user ID." })
  .length(USER_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is UserId => true);
