import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";

export const USER_PROFILE_ID_PREFIX = "user_pr_";
export const USER_PROFILE_ID_LENGTH = DEFAULT_ID_LENGTH + USER_PROFILE_ID_PREFIX.length;

export const generateUserProfileId = () => generateId(USER_PROFILE_ID_PREFIX);
