import type { Maybe } from "@repo/shared/types";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@repo/user-profile/utils/normalize-username";
import { z } from "zod";
import { publicProcedure } from "@/server/api/trpc";
import type { PublicUserProfileDto } from "../../dto/public-user-profile.dto";

export type GetPublicUserProfile = z.infer<typeof getPublicUserProfileSchema>;

export const getPublicUserProfileSchema = z.object({
  username: usernameSchema,
});

export const getPublicUserProfile = publicProcedure
  .input(getPublicUserProfileSchema)
  .query<Maybe<PublicUserProfileDto>>(async ({ ctx: { logger, requestId, db }, input: { username } }) => {
    const path = "userProfile.getPublicUserProfile";

    logger.info({ requestId, path, username }, "Get public user profile initiated.");

    const maybeUserProfile = await db.query.userProfiles.findFirst({
      where: (userProfiles, { eq }) => eq(userProfiles.usernameNormalized, normalizeUsername(username)),
      columns: {
        username: true,
        imageUrl: true,
        followingCount: true,
        followersCount: true,
        likesCount: true,
        urlsCount: true,
        userId: true,
      },
    });

    if (!maybeUserProfile) {
      logger.info({ requestId, path, username }, "User not found");
      return null;
    }

    return {
      id: maybeUserProfile.userId,
      username: maybeUserProfile.username,
      imageUrl: maybeUserProfile.imageUrl,
      followingCount: maybeUserProfile.followingCount,
      followersCount: maybeUserProfile.followersCount,
      likesCount: maybeUserProfile.likesCount,
      urlsCount: maybeUserProfile.urlsCount,
    };
  });
