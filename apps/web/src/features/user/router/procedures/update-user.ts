import { orm, schema } from "@repo/db/db";
import { apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export const updateUserSchema = z.object({
  apiKey: apiKeySchema,
});

export const updateUser = protectedProcedure
  .input(updateUserSchema)
  .mutation(async ({ input, ctx: { logger, requestId, userId, db } }) => {
    const path = "user.updateUser";

    logger.info({ requestId, path }, "Updating user initiated.");

    const maybeUser = await db.query.users.findFirst({
      columns: {
        id: true,
      },
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!maybeUser) {
      logger.error({ requestId, path }, "Failed to update user.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User does not exist.",
      });
    }

    await db.update(schema.users).set(input).where(orm.eq(schema.users.id, userId));

    logger.info({ requestId, path }, "User profile update complete.");
  });
