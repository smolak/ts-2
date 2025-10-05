import { currentUser } from "@clerk/nextjs/server";
import { orm, schema } from "@repo/db/db";
import { apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@repo/user-profile/utils/normalize-username";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";

export type CreateUserProfileSchema = z.infer<typeof createUserProfileSchema>;

// TODO: move this to some constant / configuration place
export const NOT_ALLOWED_NORMALIZED_USERNAMES = ["admin", "urlshare", "contact", "accounting", "security"];

const restrictedUsernameSchema = usernameSchema.refine(
  (username) => {
    return (
      !NOT_ALLOWED_NORMALIZED_USERNAMES.includes(username.toLowerCase()) ||
      username.toLocaleLowerCase().startsWith("urlshare")
    );
  },
  {
    message: "Username not allowed.",
  },
);

export const createUserProfileSchema = z.object({
  apiKey: apiKeySchema,
  username: restrictedUsernameSchema,
});

export const createUserProfile = protectedProcedure
  .input(createUserProfileSchema)
  .mutation(async ({ input, ctx: { logger, requestId, userId, db } }) => {
    const path = "userProfile.createUserProfile";

    logger.info({ requestId, path }, "Creating user profile initiated.");

    const maybeUserProfileData = await db.query.userProfiles.findFirst({
      columns: {
        id: true,
      },
      where: (userProfiles, { eq }) => eq(userProfiles.userId, userId),
    });

    if (maybeUserProfileData) {
      logger.error({ requestId, path }, "Failed to store the URL.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User profile already exists.",
      });
    }

    const user = await currentUser();

    const userProfile = await db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({
          apiKey: input.apiKey,
        })
        .where(orm.eq(schema.users.id, userId));

      const [result] = await tx
        .insert(schema.userProfiles)
        .values({
          userId,
          username: input.username,
          usernameNormalized: normalizeUsername(input.username),
          imageUrl: user?.imageUrl,
        })
        .returning();

      return result;
    });

    if (!userProfile) {
      logger.error({ requestId, path }, "Failed to create user profile.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Failed to create user profile.",
      });
    }

    logger.info({ requestId, path }, "User profile creation complete.");

    return userProfile;
  });
