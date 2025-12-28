/**
 * Test Database Utilities
 *
 * Provides helpers for setting up and tearing down test database state.
 * Uses the real database (not mocks) as per CODING-GUIDELINE.md:
 * - "Database queries: Use test database with real data"
 * - "Business logic: Test the actual implementation"
 *
 * Strategy: Each test should clean up its own data to ensure isolation.
 * We use table-specific cleanup to avoid foreign key constraint issues.
 */

import { type Db, orm, schema } from "@repo/db/db";
import type { DeckId } from "@repo/db/id/deck-id";
import type { UserId } from "@repo/db/id/user-id";

/**
 * Cleanup tags created during tests (by deck)
 */
export async function cleanupTags(db: Db, deckId: string): Promise<void> {
  await db.delete(schema.tags).where(orm.eq(schema.tags.deckId, deckId));
}

/**
 * Cleanup a user and all their data
 * Follows the dependency order from schema.ts
 */
export async function cleanupUser(db: Db, userId: string): Promise<void> {
  // Level 3: Delete deepest leaf dependencies first
  // deckUrlsTags references deckUrls which references decks
  await db
    .delete(schema.deckUrlsTags)
    .where(
      orm.inArray(
        schema.deckUrlsTags.deckId,
        db.select({ id: schema.decks.id }).from(schema.decks).where(orm.eq(schema.decks.userId, userId)),
      ),
    );

  // Level 2: Delete leaf dependencies
  await db.delete(schema.feeds).where(orm.eq(schema.feeds.userId, userId));

  await db.delete(schema.usersUrlsInteractions).where(orm.eq(schema.usersUrlsInteractions.userId, userId));

  await db
    .delete(schema.deckUrls)
    .where(
      orm.inArray(
        schema.deckUrls.deckId,
        db.select({ id: schema.decks.id }).from(schema.decks).where(orm.eq(schema.decks.userId, userId)),
      ),
    );

  // Tags now belong to decks, not users
  await db
    .delete(schema.tags)
    .where(
      orm.inArray(
        schema.tags.deckId,
        db.select({ id: schema.decks.id }).from(schema.decks).where(orm.eq(schema.decks.userId, userId)),
      ),
    );

  await db.delete(schema.deckFollows).where(orm.eq(schema.deckFollows.followerId, userId));
  await db
    .delete(schema.deckFollows)
    .where(
      orm.inArray(
        schema.deckFollows.deckId,
        db.select({ id: schema.decks.id }).from(schema.decks).where(orm.eq(schema.decks.userId, userId)),
      ),
    );

  // Level 1: Delete branch dependencies
  await db.delete(schema.usersUrls).where(orm.eq(schema.usersUrls.userId, userId));
  await db.delete(schema.decks).where(orm.eq(schema.decks.userId, userId));
  await db
    .delete(schema.follows)
    .where(orm.or(orm.eq(schema.follows.followerId, userId), orm.eq(schema.follows.followingId, userId)));
  await db.delete(schema.userProfiles).where(orm.eq(schema.userProfiles.userId, userId));

  // Level 0: Delete the user
  await db.delete(schema.users).where(orm.eq(schema.users.id, userId));
}

/**
 * Create a test user in the database
 * Returns the created user record
 */
export async function createTestUser(db: Db, clerkUserId?: string) {
  const [user] = await db
    .insert(schema.users)
    .values({
      clerkUserId: clerkUserId ?? `clerk_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create test user");
  }

  return user;
}

/**
 * Create a test deck in the database
 */
export async function createTestDeck(db: Db, userId: UserId, name = "Test Deck") {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const [deck] = await db
    .insert(schema.decks)
    .values({
      userId,
      name,
      slug,
    })
    .returning();

  if (!deck) {
    throw new Error("Failed to create test deck");
  }

  return deck;
}

/**
 * Create a test tag in the database
 * Tags now belong to decks, not users
 * @param displayName - The display name for the tag (stored as-is)
 */
export async function createTestTag(db: Db, deckId: DeckId, displayName: string) {
  const name = displayName.toLowerCase().trim(); // Normalized name for uniqueness

  const [tag] = await db
    .insert(schema.tags)
    .values({
      deckId,
      name,
      displayName,
    })
    .returning();

  if (!tag) {
    throw new Error("Failed to create test tag");
  }

  return tag;
}
