import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const USER_URL_ID_PREFIX = "user_url_" as const;
export const USER_URL_ID_LENGTH = DEFAULT_ID_LENGTH + USER_URL_ID_PREFIX.length;

/**
 * Branded type for UserUrl IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `UserUrlId` is expected.
 */
declare const UserUrlIdBrand: unique symbol;
export type UserUrlId = string & { readonly [UserUrlIdBrand]: typeof UserUrlIdBrand };

export const generateUserUrlId = (): UserUrlId => generateId(USER_URL_ID_PREFIX) as UserUrlId;

export const userUrlIdSchema = z
  .string()
  .trim()
  .startsWith(USER_URL_ID_PREFIX, { message: "ID passed is not a userUrl ID." })
  .length(USER_URL_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is UserUrlId => true);
