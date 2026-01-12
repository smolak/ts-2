import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const USER_PROFILE_ID_PREFIX = "user_pr_" as const;
export const USER_PROFILE_ID_LENGTH = DEFAULT_ID_LENGTH + USER_PROFILE_ID_PREFIX.length;

/**
 * Branded type for UserProfile IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `UserProfileId` is expected.
 */
declare const UserProfileIdBrand: unique symbol;
export type UserProfileId = string & { readonly [UserProfileIdBrand]: typeof UserProfileIdBrand };

export const generateUserProfileId = (): UserProfileId => generateId(USER_PROFILE_ID_PREFIX) as UserProfileId;

export const userProfileIdSchema = z
  .string()
  .trim()
  .startsWith(USER_PROFILE_ID_PREFIX, { message: "ID passed is not a user profile ID." })
  .length(USER_PROFILE_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is UserProfileId => true);
