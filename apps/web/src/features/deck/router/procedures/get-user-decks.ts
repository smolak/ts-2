import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { toDeckDto } from "@repo/deck/dto/deck.dto";

import { protectedProcedure } from "@/server/api/trpc";

type GetUserDecksResult = DeckDto[];

export const getUserDecks = protectedProcedure.query<GetUserDecksResult>(
  async ({ ctx: { logger, requestId, db, userId } }) => {
    const path = "deck.getUserDecks";

    logger.info({ requestId, path, userId }, "Fetching user's decks.");

    const decks = await db.query.decks.findMany({
      where: (decks, { eq }) => eq(decks.userId, userId),
      orderBy: (decks, { desc }) => [desc(decks.createdAt)],
    });

    logger.info({ requestId, path, userId, count: decks.length }, "User's decks fetched.");

    return decks.map(toDeckDto);
  },
);
