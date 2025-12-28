import { deckIdSchema } from "@repo/db/id/deck-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { z } from "zod";
import { publicProcedure } from "@/server/api/trpc";

export const getDeckUrlTagsSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
});

export const getDeckUrlTags = publicProcedure
  .input(getDeckUrlTagsSchema)
  .query(async ({ ctx: { logger, requestId, db }, input: { deckId, userUrlId } }) => {
    const path = "tag.getDeckUrlTags";

    logger.info({ requestId, path, deckId, userUrlId }, "Fetching deck URL tags.");

    // Verify the deck-URL association exists
    const deckUrl = await db.query.deckUrls.findFirst({
      where: (deckUrls, { and, eq }) => and(eq(deckUrls.deckId, deckId), eq(deckUrls.userUrlId, userUrlId)),
      columns: { deckId: true },
    });

    if (!deckUrl) {
      logger.warn({ requestId, path, deckId, userUrlId }, "Deck-URL association not found.");

      return [];
    }

    // Get tags for this deck-URL
    const deckUrlTags = await db.query.deckUrlsTags.findMany({
      where: (dut, { and, eq }) => and(eq(dut.deckId, deckId), eq(dut.userUrlId, userUrlId)),
      columns: { tagId: true },
      with: {
        tag: {
          columns: { id: true, name: true, displayName: true },
        },
      },
      orderBy: (dut, { asc }) => [asc(dut.tagOrder)],
    });

    logger.info({ requestId, path, deckId, userUrlId, count: deckUrlTags.length }, "Deck URL tags fetched.");

    return deckUrlTags.map((dut) => dut.tag);
  });
