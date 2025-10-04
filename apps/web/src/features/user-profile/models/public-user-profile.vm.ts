import { schema } from "@workspace/db/db";

export type PublicUserProfileVM = Omit<schema.UserProfile, "id" | "usernameNormalized" | "userId"> & {
  id: schema.UserProfile["userId"];
};

export const toPublicUserProfileVM = ({
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
}: schema.UserProfile): PublicUserProfileVM => {
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
