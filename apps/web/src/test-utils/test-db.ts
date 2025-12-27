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

/**
 * Cleanup tags created during tests
 */
export async function cleanupTags(db: Db, userId: string): Promise<void> {
  await db.delete(schema.tags).where(orm.eq(schema.tags.userId, userId));
}

/**
 * Cleanup a user and all their data
 * Follows the dependency order from schema.ts
 */
export async function cleanupUser(db: Db, userId: string): Promise<void> {
  // Level 2: Delete leaf dependencies first
  await db
    .delete(schema.userUrlsTags)
    .where(
      orm.inArray(
        schema.userUrlsTags.userUrlId,
        db.select({ id: schema.usersUrls.id }).from(schema.usersUrls).where(orm.eq(schema.usersUrls.userId, userId)),
      ),
    );

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
  await db.delete(schema.tags).where(orm.eq(schema.tags.userId, userId));
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
 * Create a test tag in the database
 */
export async function createTestTag(db: Db, userId: string, name: string) {
  const [tag] = await db
    .insert(schema.tags)
    .values({
      userId,
      name,
    })
    .returning();

  if (!tag) {
    throw new Error("Failed to create test tag");
  }

  return tag;
}
