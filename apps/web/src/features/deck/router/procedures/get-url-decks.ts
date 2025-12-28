import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import type { Deck } from "@repo/db/types";
import { z } from "zod";

import { protectedProcedure } from "@/server/api/trpc";

const getUrlDecksSchema = z.object({
  userUrlId: userUrlIdSchema,
});

export type GetUrlDecksSchema = z.infer<typeof getUrlDecksSchema>;

type GetUrlDecksResult = Array<{
  id: Deck["id"];
  name: Deck["name"];
}>;

export const getUrlDecks = protectedProcedure
  .input(getUrlDecksSchema)
  .query<GetUrlDecksResult>(async ({ input: { userUrlId }, ctx: { logger, requestId, userId, db } }) => {
    const path = "deck.getUrlDecks";

    logger.info({ requestId, path, userUrlId }, "Fetching decks for URL.");

    // Get all decks that contain this URL (only for URLs owned by the user)
    const deckUrls = await db.query.deckUrls.findMany({
      where: (deckUrls, { eq }) => eq(deckUrls.userUrlId, userUrlId),
      with: {
        deck: {
          columns: { id: true, name: true, userId: true, scheduledForDeletionAt: true },
        },
      },
    });

    // Filter to only include decks owned by the user and not pending deletion
    const userDecks = deckUrls
      .filter((du) => du.deck.userId === userId && du.deck.scheduledForDeletionAt === null)
      .map((du) => ({
        id: du.deck.id,
        name: du.deck.name,
      }));

    logger.info({ requestId, path, userUrlId, count: userDecks.length }, "Decks for URL fetched.");

    return userDecks;
  });
