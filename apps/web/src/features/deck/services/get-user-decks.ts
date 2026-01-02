import type { Db } from "@repo/db/db";
import type { UserId } from "@repo/db/id/user-id";
import type { Deck } from "@repo/db/types";

interface GetUserDecksParams {
  db: Db;
  userId: UserId;
}

/**
 * Fetches all non-deleted decks for a user.
 * Used by both tRPC procedure and API route.
 */
export async function getUserDecks({ db, userId }: GetUserDecksParams): Promise<Deck[]> {
  return db.query.decks.findMany({
    where: (decks, { eq, isNull, and }) => and(eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
    orderBy: (decks, { desc }) => [desc(decks.createdAt)],
  });
}
