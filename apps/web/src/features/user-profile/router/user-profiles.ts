import { createTRPCRouter } from "@/server/api/trpc";
import { createUserProfile } from "./procedures/create-user-profile";
import { getPrivateUserProfile } from "./procedures/get-private-user-profile";
import { getPublicUserProfile } from "./procedures/get-public-user-profile";
import { updateUserProfile } from "./procedures/update-user-profile";
import { userHasProfileCreated } from "./procedures/user-has-profile-created";
import { usernameCheck } from "./procedures/username-check";

export const userProfilesRouter = createTRPCRouter({
  createUserProfile,
  getPrivateUserProfile,
  getPublicUserProfile,
  updateUserProfile,
  userHasProfileCreated,
  usernameCheck,
});
