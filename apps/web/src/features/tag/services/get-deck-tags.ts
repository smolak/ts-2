import type { Db } from "@repo/db/db";
import type { DeckId } from "@repo/db/id/deck-id";
import type { UserId } from "@repo/db/id/user-id";
import type { TagDto } from "@repo/tag/dto/tag.dto";

import { DeckNotFoundError } from "./errors";

interface GetDeckTagsParams {
  db: Db;
  userId: UserId;
  deckId: DeckId;
}

interface GetDeckTagsResult {
  tags: TagDto[];
}

/**
 * Fetches all tags for a deck after verifying ownership.
 * Used by both tRPC procedure and API route.
 *
 * @throws DeckNotFoundError if deck not found or not owned by user
 */
export async function getDeckTags({ db, userId, deckId }: GetDeckTagsParams): Promise<GetDeckTagsResult> {
  // Verify deck ownership and fetch tags in parallel
  const [deck, tags] = await Promise.all([
    db.query.decks.findFirst({
      where: (decks, { and, eq, isNull }) =>
        and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
      columns: { id: true },
    }),
    db.query.tags.findMany({
      columns: {
        id: true,
        name: true,
        displayName: true,
        urlsCount: true,
      },
      where: (tags, { eq }) => eq(tags.deckId, deckId),
      orderBy: (tags, { asc }) => [asc(tags.name)],
    }),
  ]);

  if (!deck) {
    throw new DeckNotFoundError();
  }

  return { tags };
}
