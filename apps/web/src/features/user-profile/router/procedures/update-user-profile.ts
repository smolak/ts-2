import { orm, schema } from "@repo/db/db";
import { apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";

export type UpdateUserProfileSchema = z.infer<typeof updateUserProfileSchema>;

export const updateUserProfileSchema = z.object({
  apiKey: apiKeySchema,
});

export const updateUserProfile = protectedProcedure
  .input(updateUserProfileSchema)
  .mutation(async ({ input, ctx: { logger, requestId, userId, db } }) => {
    const path = "userProfile.updateUserProfile";

    logger.info({ requestId, path }, "Updating user profile initiated.");

    const maybeUser = await db.query.users.findFirst({
      columns: {
        id: true,
      },
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!maybeUser) {
      logger.error({ requestId, path }, "Failed to update user profile.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User profile does not exist.",
      });
    }

    // TODO: perhaps it is a good idea to update the user image url as well, using currentUser() from clerk

    await db.update(schema.users).set(input).where(orm.eq(schema.users.id, userId));

    logger.info({ requestId, path }, "User profile update complete.");

    return true;
  });
