import type { Maybe } from "@repo/shared/types";
import { protectedProcedure } from "@/server/api/trpc";
import type { PrivateUserProfileDto } from "../../dto/private-user-profile.dto";

export const getPrivateUserProfile = protectedProcedure.query<Maybe<PrivateUserProfileDto>>(
  async ({ ctx: { logger, requestId, userId, db } }) => {
    const path = "userProfile.getPrivateUserProfile";

    logger.info({ requestId, path, userId }, "Get private user profile initiated.");

    const maybeUserProfile = await db.query.userProfiles.findFirst({
      where: (userProfiles, { eq }) => eq(userProfiles.userId, userId),
      columns: {
        username: true,
        imageUrl: true,
      },
      with: {
        user: {
          columns: {
            apiKey: true,
            plan: true,
          },
        },
      },
    });

    if (maybeUserProfile) {
      return {
        ...maybeUserProfile,
        id: userId,
        apiKey: maybeUserProfile.user.apiKey,
        plan: maybeUserProfile.user.plan,
      };
    }

    logger.info({ requestId, path, userId }, "User not found");

    return undefined;
  },
);
