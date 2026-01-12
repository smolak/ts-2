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
import type { TagId } from "@repo/db/id/tag-id";
import type { UrlId } from "@repo/db/id/url-id";
import type { UserId } from "@repo/db/id/user-id";
import type { UserUrlId } from "@repo/db/id/user-url-id";
import { normalizeUsername } from "@repo/user-profile/normalized-username/normalized-username";

/**
 * Cleanup tags created during tests (by deck)
 */
export async function cleanupTags(db: Db, deckId: DeckId): Promise<void> {
  await db.delete(schema.tags).where(orm.eq(schema.tags.deckId, deckId));
}

/**
 * Cleanup a user and all their data
 * Follows the dependency order from schema.ts
 */
export async function cleanupUser(db: Db, userId: UserId): Promise<void> {
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

  // Delete interactions where user is the liker OR where the URL being liked belongs to this user
  await db
    .delete(schema.usersUrlsInteractions)
    .where(
      orm.or(
        orm.eq(schema.usersUrlsInteractions.userId, userId),
        orm.inArray(
          schema.usersUrlsInteractions.userUrlId,
          db.select({ id: schema.usersUrls.id }).from(schema.usersUrls).where(orm.eq(schema.usersUrls.userId, userId)),
        ),
      ),
    );

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

/**
 * Create a test URL in the database
 * @param url - The URL string (defaults to test URL)
 * @param metadata - Optional metadata object
 */
export async function createTestUrl(
  db: Db,
  url = `https://example.com/test-${Date.now()}`,
  metadata: Record<string, unknown> = {},
) {
  // Generate a unique compound hash for the URL
  const compoundHash = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`.padEnd(64, "0").slice(0, 64);

  const [urlRecord] = await db
    .insert(schema.urls)
    .values({
      url,
      compoundHash,
      metadata,
    })
    .returning();

  if (!urlRecord) {
    throw new Error("Failed to create test URL");
  }

  return urlRecord;
}

/**
 * Create a test user URL association (usersUrls)
 * Links a URL to a user
 */
export async function createTestUserUrl(db: Db, userId: UserId, urlId: UrlId) {
  const [userUrl] = await db
    .insert(schema.usersUrls)
    .values({
      userId,
      urlId,
    })
    .returning();

  if (!userUrl) {
    throw new Error("Failed to create test user URL");
  }

  return userUrl;
}

/**
 * Create a test URL and associate it with a user in one call
 * Returns both the URL and the userUrl association
 */
export async function createTestUserUrlWithUrl(
  db: Db,
  userId: UserId,
  url = `https://example.com/test-${Date.now()}`,
  metadata: Record<string, unknown> = {},
) {
  const urlRecord = await createTestUrl(db, url, metadata);
  const userUrl = await createTestUserUrl(db, userId, urlRecord.id);

  return { url: urlRecord, userUrl };
}

/**
 * Add a URL to a deck (deckUrls junction table)
 */
export async function createTestDeckUrl(db: Db, deckId: DeckId, userUrlId: UserUrlId) {
  await db.insert(schema.deckUrls).values({
    deckId,
    userUrlId,
  });

  // Increment deck's urlsCount
  await db
    .update(schema.decks)
    .set({ urlsCount: orm.sql`${schema.decks.urlsCount} + 1` })
    .where(orm.eq(schema.decks.id, deckId));
}

/**
 * Associate a tag with a deck URL (deckUrlsTags junction table)
 */
export async function createTestDeckUrlTag(db: Db, deckId: DeckId, userUrlId: UserUrlId, tagId: TagId, tagOrder = 0) {
  await db.insert(schema.deckUrlsTags).values({
    deckId,
    userUrlId,
    tagId,
    tagOrder,
  });
}

/**
 * Create a test user profile
 */
export async function createTestUserProfile(
  db: Db,
  userId: UserId,
  username = `testuser_${Date.now()}`,
  imageUrl: string | null = null,
) {
  const [profile] = await db
    .insert(schema.userProfiles)
    .values({
      userId,
      username,
      usernameNormalized: normalizeUsername(username),
      imageUrl,
    })
    .returning();

  if (!profile) {
    throw new Error("Failed to create test user profile");
  }

  return profile;
}

/**
 * Ensure the "LIKED" interaction type exists in the database
 * This is a lookup table that needs to be seeded for like functionality to work
 */
export async function ensureLikedInteractionType(db: Db) {
  const existing = await db.query.interactionTypes.findFirst({
    where: (interactionTypes, { eq }) => eq(interactionTypes.id, 1),
  });

  if (!existing) {
    await db.insert(schema.interactionTypes).values({
      id: 1,
      name: "LIKED",
    });
  }
}
