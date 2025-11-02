import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { z } from "zod";
import { publicProcedure } from "@/server/api/trpc";

export const getUserUrlTagsSchema = z.object({
  userUrlId: userUrlIdSchema,
});

export const getUserUrlTags = publicProcedure
  .input(getUserUrlTagsSchema)
  .query(async ({ ctx: { logger, requestId, db }, input: { userUrlId } }) => {
    const path = `tag.${getUserUrlTags.name}`;

    logger.info({ requestId, path, userUrlId }, "Fetching user url's tags.");

    const userUrlTags = await db.query.userUrlsTags.findMany({
      columns: {
        tagId: true,
      },
      where: (userUrlsTags, { eq }) => eq(userUrlsTags.userUrlId, userUrlId),
    });

    logger.info({ requestId, path, userUrlId }, "User url's tags fetched.");

    return userUrlTags;
  });
