import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "@/server/api/trpc";
import { type PrivateUserProfileDto, toPrivateUserProfileDto } from "../../dto/private-user-profile.dto";

export const getPrivateUserProfile = protectedProcedure.query<PrivateUserProfileDto>(
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
          },
        },
      },
    });

    if (maybeUserProfile) {
      return toPrivateUserProfileDto({
        ...maybeUserProfile,
        id: userId,
        apiKey: maybeUserProfile.user.apiKey,
      });
    }

    logger.info({ requestId, path, userId }, "User not found");

    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  },
);
