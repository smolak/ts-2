import type { Tag } from "@repo/db/types";
import { TRPCError } from "@trpc/server";

import {
  createTag as createTagFn,
  DeckNotFoundError,
  TagAlreadyExistsError,
  TagCreationError,
} from "@/features/tag/services";
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

      try {
        const result = await createTagFn({ db, userId, deckId, displayName });

        logger.info({ requestId, path, deckId, name: result.name, displayName }, "Tag created.");

        return result;
      } catch (error) {
        if (error instanceof DeckNotFoundError) {
          logger.error({ requestId, path, deckId }, "Deck not found or not owned by user.");
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Deck not found.",
          });
        }

        if (error instanceof TagAlreadyExistsError) {
          logger.error({ requestId, path, deckId, displayName }, error.message);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tag name already exists in this deck. Use a different name.",
          });
        }

        if (error instanceof TagCreationError) {
          logger.error({ requestId, path, deckId, displayName }, "Tag ID not retrieved for created tag.");
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tag could not be created.",
          });
        }

        throw error;
      }
    },
  );
