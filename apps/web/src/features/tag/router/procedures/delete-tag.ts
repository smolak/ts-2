import { orm, schema } from "@repo/db/db";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import {
  type DeleteTagSchema,
  deleteTagSchema,
} from "../../schemas/delete-tag.schema";

// TODO: Split schema exports from server-only procedures for all router procedures to prevent client-side imports of server code
export type { DeleteTagSchema };
export { deleteTagSchema };

export const deleteTag = protectedProcedure
  .input(deleteTagSchema)
  .mutation(async ({ input: { id }, ctx: { logger, requestId, userId, db } }) => {
    const path = "tag.deleteTag";

    const maybeTag = await db.query.tags.findFirst({
      where: (tags, { and, eq }) => and(eq(tags.userId, userId), eq(tags.id, id)),
    });

    if (!maybeTag) {
      logger.error({ requestId, path }, `Tag (${id}) doesn't exist.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Tag doesn't exists.`,
      });
    }

    await db.delete(schema.tags).where(orm.eq(schema.tags.id, id));

    logger.info({ requestId, path, id }, `Tag (${id})} deleted.`);
  });
