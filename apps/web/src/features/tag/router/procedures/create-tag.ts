import { schema } from "@repo/db/db";
import type { Tag } from "@repo/db/types";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/server/api/trpc";

import {
  type CreateTagSchema,
  createTagSchema,
} from "../../schemas/create-tag.schema";

// TODO: Split schema exports from server-only procedures for all router procedures to prevent client-side imports of server code
export type { CreateTagSchema };
export { createTagSchema };

type CreateTagResult = {
  tagId: Tag["id"];
};

export const createTag = protectedProcedure
  .input(createTagSchema)
  .mutation<CreateTagResult>(async ({ input: { name }, ctx: { logger, requestId, userId, db } }) => {
    const path = "tag.createTag";

    const maybeTag = await db.query.tags.findFirst({
      where: (tags, { and, eq }) => and(eq(tags.userId, userId), eq(tags.name, name)),
    });

    if (maybeTag) {
      logger.error({ requestId, path }, `Tag (${name}) exists.`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Tag name exists. Use different tag name.`,
      });
    }

    const [result] = await db
      .insert(schema.tags)
      .values({ userId, name })
      .returning({ insertedId: schema.tags.id });

    if (!result) {
      logger.error({ requestId, path }, `Tag ID not retrieved for created tag (${name}).`);

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Tag could not be created.`,
      });
    }

    logger.info({ requestId, path, name }, "Tag created.");

    return { tagId: result.insertedId };
  });
