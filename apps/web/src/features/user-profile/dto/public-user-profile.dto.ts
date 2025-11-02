import type { UserProfile } from "@repo/db/types";

export type PublicUserProfileDto = Omit<UserProfile, "id" | "usernameNormalized" | "userId"> & {
  id: UserProfile["userId"];
};

export const toPublicUserProfileDto = ({
  username,
  imageUrl,
  followingCount,
  followersCount,
  likesCount,
  likedCount,
  createdAt,
  updatedAt,
  userId,
  urlsCount,
}: UserProfile): PublicUserProfileDto => {
  return {
    username,
    imageUrl,
    followingCount,
    followersCount,
    createdAt,
    updatedAt,
    id: userId,
    likesCount,
    likedCount,
    urlsCount,
  };
};
