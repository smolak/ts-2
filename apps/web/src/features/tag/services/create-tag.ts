import type { Db } from "@repo/db/db";
import { schema } from "@repo/db/db";
import type { DeckId } from "@repo/db/id/deck-id";
import type { UserId } from "@repo/db/id/user-id";
import type { Tag } from "@repo/db/types";

interface CreateTagParams {
  db: Db;
  userId: UserId;
  deckId: DeckId;
  displayName: string;
}

interface CreateTagResult {
  tagId: Tag["id"];
  name: Tag["name"];
  displayName: Tag["displayName"];
}

export class DeckNotFoundError extends Error {
  constructor() {
    super("Deck not found.");
    this.name = "DeckNotFoundError";
  }
}

export class TagAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Tag "${name}" already exists in this deck.`);
    this.name = "TagAlreadyExistsError";
  }
}

export class TagCreationError extends Error {
  constructor() {
    super("Tag could not be created.");
    this.name = "TagCreationError";
  }
}

/**
 * Creates a new tag in a deck after verifying ownership and uniqueness.
 * Used by both tRPC procedure and API route.
 *
 * @throws DeckNotFoundError if deck not found or not owned by user
 * @throws TagAlreadyExistsError if tag with same name exists in deck
 * @throws TagCreationError if insert fails
 */
export async function createTag({ db, userId, deckId, displayName }: CreateTagParams): Promise<CreateTagResult> {
  // Normalize name for uniqueness check and search
  const name = displayName.toLowerCase().trim();

  // Verify deck ownership and check tag uniqueness (parallel queries)
  const [deck, existingTag] = await Promise.all([
    db.query.decks.findFirst({
      where: (decks, { and, eq, isNull }) =>
        and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
      columns: { id: true },
    }),
    db.query.tags.findFirst({
      where: (tags, { and, eq }) => and(eq(tags.deckId, deckId), eq(tags.name, name)),
      columns: { id: true },
    }),
  ]);

  if (!deck) {
    throw new DeckNotFoundError();
  }

  if (existingTag) {
    throw new TagAlreadyExistsError(name);
  }

  const [result] = await db
    .insert(schema.tags)
    .values({ deckId, name, displayName })
    .returning({ insertedId: schema.tags.id });

  if (!result) {
    throw new TagCreationError();
  }

  return { tagId: result.insertedId, name, displayName };
}
