import type { UserProfile } from "@repo/db/types";

/**
 * Public user profile data exposed to the UI.
 * Only includes fields that are actually used in components.
 */
export type PublicUserProfileDto = {
  id: UserProfile["userId"];
  username: UserProfile["username"];
  imageUrl: UserProfile["imageUrl"];
  followingCount: UserProfile["followingCount"];
  followersCount: UserProfile["followersCount"];
  likesCount: UserProfile["likesCount"];
  urlsCount: UserProfile["urlsCount"];
};
