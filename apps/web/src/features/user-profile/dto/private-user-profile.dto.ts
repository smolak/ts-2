import type { User, UserProfile } from "@repo/db/types";

// TODO: check if we can take all of user profile data and just add apiKey to it
export type PrivateUserProfileDto = Pick<UserProfile, "username" | "imageUrl"> & Pick<User, "id" | "apiKey" | "plan">;
