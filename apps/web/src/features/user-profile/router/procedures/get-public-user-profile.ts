import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@repo/user-profile/utils/normalize-username";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "@/server/api/trpc";
import { type PublicUserProfileDto, toPublicUserProfileDto } from "../../dto/public-user-profile.dto";

export type GetPublicUserProfile = z.infer<typeof getPublicUserProfileSchema>;

export const getPublicUserProfileSchema = z.object({
  username: usernameSchema,
});

export const getPublicUserProfile = publicProcedure
  .input(getPublicUserProfileSchema)
  .query<PublicUserProfileDto>(async ({ ctx: { logger, requestId, db }, input: { username } }) => {
    const path = "userProfile.getPublicUserProfile";

    logger.info({ requestId, path, username }, "Get public user profile initiated.");

    const maybeUserProfile = await db.query.userProfiles.findFirst({
      where: (userProfiles, { eq }) => eq(userProfiles.usernameNormalized, normalizeUsername(username)),
    });

    if (maybeUserProfile) {
      return toPublicUserProfileDto(maybeUserProfile);
    }

    logger.info({ requestId, path, username }, "User not found");

    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  });
