import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@repo/user-profile/utils/normalize-username";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";

export const usernameCheckSchema = z.object({
  username: usernameSchema,
});

export const usernameCheck = protectedProcedure
  .input(usernameCheckSchema)
  .mutation(async ({ input: { username }, ctx: { logger, requestId, db } }) => {
    const path = "userProfileData.usernameCheck";

    logger.info({ requestId, path, username }, "Checking username availability.");

    const usernameNormalized = normalizeUsername(username);

    const match = await db.query.userProfiles.findFirst({
      where: (userProfiles, { eq }) => eq(userProfiles.usernameNormalized, usernameNormalized),
    });
    const usernameAvailable = match === undefined;

    logger.info({ requestId, path, username, usernameAvailable }, "Username availability checked.");

    return { usernameAvailable };
  });
