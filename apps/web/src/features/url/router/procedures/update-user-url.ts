import { orm, schema } from "@repo/db/db";
import { deckIdSchema } from "@repo/db/id/deck-id";
import { tagIdSchema } from "@repo/db/id/tag-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";
import { selectTagIdsForUpdate } from "./utils/select-tag-ids-for-update";

export type UpdateDeckUrlTagsSchema = z.infer<typeof updateDeckUrlTagsSchema>;

export const updateDeckUrlTagsSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
  tagIds: z.array(tagIdSchema),
});

export const updateDeckUrlTags = protectedProcedure
  .input(updateDeckUrlTagsSchema)
  .mutation(async ({ input: { deckId, userUrlId, tagIds }, ctx: { logger, requestId, userId, db } }) => {
    const path = "deckUrl.updateDeckUrlTags";

    // Verify deck ownership and deck-URL association (parallel queries)
    const [deck, deckUrl] = await Promise.all([
      db.query.decks.findFirst({
        where: (decks, { and, eq, isNull }) =>
          and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
        columns: { id: true },
      }),
      db.query.deckUrls.findFirst({
        where: (deckUrls, { and, eq }) => and(eq(deckUrls.deckId, deckId), eq(deckUrls.userUrlId, userUrlId)),
        columns: { deckId: true },
      }),
    ]);

    if (!deck) {
      logger.error({ requestId, path, deckId }, "Deck not found or not owned by user.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Deck not found.",
      });
    }

    if (!deckUrl) {
      logger.error({ requestId, path, deckId, userUrlId }, "URL not found in this deck.");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "URL not found in this deck.",
      });
    }

    const [deckTags, currentDeckUrlTags] = await Promise.all([
      tagIds.length > 0
        ? db.query.tags.findMany({
            where: (tags, { and, eq, inArray }) => and(eq(tags.deckId, deckId), inArray(tags.id, tagIds)),
            columns: { id: true },
          })
        : Promise.resolve([]),
      db.query.deckUrlsTags.findMany({
        columns: { tagId: true },
        where: (dut, { and, eq }) => and(eq(dut.deckId, deckId), eq(dut.userUrlId, userUrlId)),
      }),
    ]);

    // Verify all provided tags belong to this deck
    if (tagIds.length > 0 && deckTags.length !== tagIds.length) {
      logger.error({ requestId, path, deckId, tagIds }, "Some tags don't belong to this deck.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Some tags don't belong to this deck.",
      });
    }

    const currentTagIds = currentDeckUrlTags.map(({ tagId }) => tagId);

    // Determine which tags to add and remove
    const { increment, decrement } = selectTagIdsForUpdate({
      currentTagIds,
      newTagIds: tagIds,
    });

    await db.transaction(async (tx) => {
      // Remove tags that are no longer selected
      if (decrement.length > 0) {
        await tx
          .delete(schema.deckUrlsTags)
          .where(
            orm.and(
              orm.eq(schema.deckUrlsTags.deckId, deckId),
              orm.eq(schema.deckUrlsTags.userUrlId, userUrlId),
              orm.inArray(schema.deckUrlsTags.tagId, decrement),
            ),
          );

        // Decrement urlsCount for removed tags (tags in this deck)
        await tx
          .update(schema.tags)
          .set({ urlsCount: orm.sql`${schema.tags.urlsCount} - 1` })
          .where(orm.and(orm.inArray(schema.tags.id, decrement), orm.eq(schema.tags.deckId, deckId)));
      }

      // Add new tags
      if (increment.length > 0) {
        const dataToAdd = increment.map((tagId, index) => ({
          deckId,
          userUrlId,
          tagId,
          tagOrder: currentTagIds.length + index + 1,
        }));

        await tx.insert(schema.deckUrlsTags).values(dataToAdd);

        // Increment urlsCount for added tags (tags in this deck)
        await tx
          .update(schema.tags)
          .set({ urlsCount: orm.sql`${schema.tags.urlsCount} + 1` })
          .where(orm.and(orm.inArray(schema.tags.id, increment), orm.eq(schema.tags.deckId, deckId)));
      }
    });

    logger.info({ requestId, path, deckId, userUrlId }, "Deck URL tags updated.");

    return { success: true };
  });
