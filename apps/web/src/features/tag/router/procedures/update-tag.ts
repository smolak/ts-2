import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import {
  type UpdateTagSchema,
  updateTagSchema,
} from "../../schemas/update-tag.schema";

// TODO: Split schema exports from server-only procedures for all router procedures to prevent client-side imports of server code
export type { UpdateTagSchema };
export { updateTagSchema };

export const updateTag = protectedProcedure
  .input(updateTagSchema)
  .mutation(async ({ input: { id, name }, ctx: { logger, requestId, userId, db } }) => {
    const path = "tag.updateTag";

    const maybeTag = await db.query.tags.findFirst({
      where: (tags, { and, eq }) => and(eq(tags.id, id), eq(tags.userId, userId)),
    });

    if (!maybeTag) {
      logger.error({ requestId, path }, `Tag (${name}) doesn't exist.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Tag (${name}) doesn't exists.`,
      });
    }

    const maybeExists = await db.query.tags.findFirst({
      where: (tags, { and, eq, not }) =>
        and(eq(tags.userId, userId), eq(tags.name, name), not(eq(tags.id, id))),
    });

    if (maybeExists) {
      logger.error({ requestId, path }, `Tag (${name}) exists.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Tag name exists. Use different tag name.`,
      });
    }

    const [updatedTag] = await db
      .update(schema.tags)
      .set({
        name,
      })
      .where(orm.eq(schema.tags.id, id))
      .returning();

    logger.info({ requestId, path, name }, "Tag updated.");

    if (!updatedTag) {
      logger.error({ requestId, path }, "Tag could not be updated.");

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tag could not be updated, try again.",
      });
    }

    return updatedTag;
  });
