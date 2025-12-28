import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { deleteTagSchema } from "../../schemas/delete-tag.schema";

export const deleteTag = protectedProcedure
  .input(deleteTagSchema)
  .mutation(async ({ input: { id }, ctx: { logger, requestId, userId, db } }) => {
    const path = "tag.deleteTag";

    const maybeTag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, id),
      columns: { id: true },
      with: {
        deck: {
          columns: { userId: true },
        },
      },
    });

    if (!maybeTag || maybeTag.deck.userId !== userId) {
      logger.error({ requestId, path, tagId: id }, "Tag not found or not owned by user.");

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tag not found.",
      });
    }

    // Delete tag (cascade will handle deckUrlsTags entries)
    await db.delete(schema.tags).where(orm.eq(schema.tags.id, id));

    logger.info({ requestId, path, tagId: id }, "Tag deleted.");
  });
