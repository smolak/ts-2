import { schema } from "@repo/db/db";
import type { Tag } from "@repo/db/types";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import { createTagSchema } from "../../schemas/create-tag.schema";

type CreateTagResult = {
  tagId: Tag["id"];
  name: Tag["name"];
  displayName: Tag["displayName"];
};

export const createTag = protectedProcedure
  .input(createTagSchema)
  .mutation<CreateTagResult>(
    async ({ input: { deckId, name: displayName }, ctx: { logger, requestId, userId, db } }) => {
      const path = "tag.createTag";

      // Normalize name for uniqueness check and search
      const name = displayName.toLowerCase().trim();

      // Verify deck ownership and check tag uniqueness (parallel queries)
      const [deck, existingTag] = await Promise.all([
        db.query.decks.findFirst({
          where: (decks, { and, eq, isNull }) =>
            and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
          columns: { id: true },
        }),
        db.query.tags.findFirst({
          where: (tags, { and, eq }) => and(eq(tags.deckId, deckId), eq(tags.name, name)),
          columns: { id: true },
        }),
      ]);

      if (!deck) {
        logger.error({ requestId, path, deckId }, "Deck not found or not owned by user.");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deck not found.",
        });
      }

      if (existingTag) {
        logger.error({ requestId, path, deckId, name }, `Tag (${name}) already exists in deck.`);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tag name already exists in this deck. Use a different name.",
        });
      }

      const [result] = await db
        .insert(schema.tags)
        .values({ deckId, name, displayName })
        .returning({ insertedId: schema.tags.id });

      if (!result) {
        logger.error({ requestId, path, deckId, name }, "Tag ID not retrieved for created tag.");

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tag could not be created.",
        });
      }

      logger.info({ requestId, path, deckId, name, displayName }, "Tag created.");

      return { tagId: result.insertedId, name, displayName };
    },
  );
