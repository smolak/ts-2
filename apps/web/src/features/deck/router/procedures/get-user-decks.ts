import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { toDeckDto } from "@repo/deck/dto/deck.dto";

import { getUserDecks as getUserDecksFn } from "@/features/deck/services/get-user-decks";
import { protectedProcedure } from "@/server/api/trpc";

type GetUserDecksResult = DeckDto[];

export const getUserDecks = protectedProcedure.query<GetUserDecksResult>(
  async ({ ctx: { logger, requestId, db, userId } }) => {
    const path = "deck.getUserDecks";

    logger.info({ requestId, path, userId }, "Fetching user's decks.");

    const decks = await getUserDecksFn({ db, userId });

    logger.info({ requestId, path, userId, count: decks.length }, "User's decks fetched.");

    return decks.map(toDeckDto);
  },
);
