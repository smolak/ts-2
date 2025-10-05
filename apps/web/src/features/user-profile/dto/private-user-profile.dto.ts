import type { User, UserProfile } from "@repo/db/schema";

// TODO: check if we can take all of user profile data and just add apiKey to it
export type PrivateUserProfileDto = Pick<UserProfile, "username" | "imageUrl"> & Pick<User, "id" | "apiKey">;

export const toPrivateUserProfileDto = ({
  id,
  apiKey,
  username,
  imageUrl,
}: PrivateUserProfileDto): PrivateUserProfileDto => {
  return { id, apiKey, username, imageUrl };
};
