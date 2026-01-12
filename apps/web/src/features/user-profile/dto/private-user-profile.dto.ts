import type { User } from "@repo/db/types";
import type { PublicUserProfileDto } from "./public-user-profile.dto";

export type PrivateUserProfileDto = PublicUserProfileDto & Pick<User, "apiKey" | "plan">;
