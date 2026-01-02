import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { updateTagSchema } from "../../schemas/update-tag.schema";

export const updateTag = protectedProcedure
  .input(updateTagSchema)
  .mutation(async ({ input: { id, name: displayName }, ctx: { logger, requestId, userId, db } }) => {
    const path = "tag.updateTag";

    // Normalize name for uniqueness check
    const name = displayName.toLowerCase().trim();

    // Find tag and verify ownership through deck
    const maybeTag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, id),
      columns: { id: true, deckId: true },
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

    // Check if another tag with same normalized name exists in this deck
    const maybeExists = await db.query.tags.findFirst({
      where: (tags, { and, eq, not }) =>
        and(eq(tags.deckId, maybeTag.deckId), eq(tags.name, name), not(eq(tags.id, id))),
      columns: { id: true },
    });

    if (maybeExists) {
      logger.error({ requestId, path, name }, `Tag (${name}) already exists in deck.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tag name already exists in this deck. Use a different name.",
      });
    }

    const [updatedTag] = await db
      .update(schema.tags)
      .set({ name, displayName })
      .where(orm.eq(schema.tags.id, id))
      .returning({
        id: schema.tags.id,
        name: schema.tags.name,
        displayName: schema.tags.displayName,
        urlsCount: schema.tags.urlsCount,
      });

    if (!updatedTag) {
      logger.error({ requestId, path }, "Tag could not be updated.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tag could not be updated, try again.",
      });
    }

    logger.info({ requestId, path, tagId: id, name, displayName }, "Tag updated.");

    return updatedTag;
  });
