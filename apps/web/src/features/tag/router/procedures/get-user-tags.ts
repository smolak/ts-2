import type { TagDto } from "@repo/tag/dto/tag.dto";
import { protectedProcedure } from "@/server/api/trpc";

type GetUserTagsResult = TagDto[];

export const getUserTags = protectedProcedure.query<GetUserTagsResult>(
  async ({ ctx: { logger, requestId, db, userId } }) => {
    const path = "tag.getUserTags";

    logger.info({ requestId, path, userId }, "Fetching user's tags.");

    const tags = await db.query.tags.findMany({
      columns: {
        id: true,
        name: true,
        urlsCount: true,
      },
      where: (tags, { eq }) => eq(tags.userId, userId),
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });

    logger.info({ requestId, path, userId }, "User's tags fetched.");

    return tags;
  },
);
