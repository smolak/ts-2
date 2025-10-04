import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";
import { completeUserProfileSchema } from "../../schemas/complete-user-profile.schema";

export const userHasProfileCreated = protectedProcedure.query<boolean>(
  async ({ ctx: { logger, requestId, userId, db } }) => {
    const path = "userProfile.userHasProfileCreated";

    logger.info({ requestId, path, userId }, "Check if user has profile created.");

    const maybeUserProfile = await db.query.userProfiles.findFirst({
      where: (userProfiles, { eq }) => eq(userProfiles.userId, userId),
      columns: {
        username: true,
      },
      with: {
        user: {
          columns: {
            apiKey: true,
          },
        },
      },
    });

    if (!maybeUserProfile) {
      return false;
    }

    if (maybeUserProfile) {
      const checkResult = completeUserProfileSchema.safeParse({
        username: maybeUserProfile.username,
        apiKey: maybeUserProfile.user.apiKey,
      });

      return checkResult.success;
    }

    logger.info({ requestId, path, userId }, "User profile not found");

    throw new TRPCError({ code: "NOT_FOUND", message: "User profile not found" });
  },
);
