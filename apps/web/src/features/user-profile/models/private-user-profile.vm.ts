import { schema } from "@workspace/db/db";

export type PrivateUserProfileVM = Pick<schema.UserProfile, "username" | "imageUrl"> &
  Pick<schema.User, "id" | "apiKey">;

export const toPrivateUserProfileVM = ({
  id,
  apiKey,
  username,
  imageUrl,
}: PrivateUserProfileVM): PrivateUserProfileVM => {
  return { id, apiKey, username, imageUrl };
};
