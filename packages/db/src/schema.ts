/**
 * DATABASE SCHEMA DEPENDENCY GRAPH
 *
 * This graph shows the deletion dependency hierarchy for all tables.
 * Entries in tables must be deleted in bottom-up order (leaves → branches → roots).
 *
 * @auto-update-dependency-graph
 * This directive indicates that the dependency graph below should be automatically updated
 * whenever foreign key relationships are added, removed, or modified in this schema file.
 * The graph must reflect the current state of all .references() calls and their onDelete behaviors.
 *
 * DEPENDENCY HIERARCHY (deletion order: bottom to top):
 *
 * Level 0 - ROOT TABLES (no dependencies, can be deleted independently if no children exist):
 *   - users
 *   - urls
 *   - interactionTypes
 *   - urlHashesCompoundHashesCounts
 *
 * Level 1 - DEPEND ON ROOTS:
 *   - userProfiles → users (onDelete: restrict)
 *   - urlHashes → urls (onDelete: restrict)
 *   - usersUrls → users (onDelete: restrict), urls (onDelete: restrict)
 *   - follows → users (followerId: restrict, followingId: restrict) [DEPRECATED - to be removed]
 *   - decks → users (onDelete: restrict)
 *
 * Level 2 - DEPEND ON LEVEL 1:
 *   - tags → decks (onDelete: cascade)
 *   - feeds → users (onDelete: restrict), usersUrls (onDelete: restrict), decks (onDelete: restrict)
 *   - usersUrlsInteractions → usersUrls (onDelete: restrict), users (onDelete: restrict), interactionTypes (onDelete: no action)
 *   - deckUrls → decks (onDelete: restrict), usersUrls (onDelete: restrict)
 *   - deckFollows → decks (onDelete: restrict), users (onDelete: restrict)
 *
 * Level 3 - DEPEND ON LEVEL 2:
 *   - deckUrlsTags → deckUrls (composite: deckId, userUrlId), tags (onDelete: cascade)
 *
 * DELETION ORDER EXAMPLE (to delete a deck with id = X):
 *   1. Delete from deckUrlsTags (where deckId = X)
 *   2. Delete from deckUrls (where deckId = X)
 *   3. Delete from tags (where deckId = X) - or CASCADE handles this
 *   4. Delete from deckFollows (where deckId = X)
 *   5. Delete from feeds (where deckId = X)
 *   6. Delete from decks (id = X)
 *
 * COMPLETE DELETION SEQUENCE (to delete a user with id = X):
 *
 *   Step 1: For each deck owned by user:
 *   ─────────────────────────────────────────────────────────────
 *   1. Delete from deckUrlsTags (where deckId IN user's decks)
 *   2. Delete from deckUrls (where deckId IN user's decks)
 *   3. Delete from tags (where deckId IN user's decks) - CASCADE handles
 *   4. Delete from deckFollows (where deckId IN user's decks)
 *   5. Delete from feeds (where deckId IN user's decks)
 *   6. Delete from decks (where userId = X)
 *
 *   Step 2: Delete user's URLs and interactions:
 *   ─────────────────────────────────────────────────────────────
 *   7. Delete from usersUrlsInteractions
 *      WHERE userId = X
 *         OR userUrlId IN (SELECT id FROM usersUrls WHERE userId = X)
 *   8. Delete from feeds (where userId = X) - own feed entries
 *   9. Delete from usersUrls WHERE userId = X
 *
 *   Step 3: Delete follows and profile:
 *   ─────────────────────────────────────────────────────────────
 *   10. Delete from deckFollows (where followerId = X) - user's follows
 *   11. Delete from follows (where followerId = X OR followingId = X)
 *   12. Delete from userProfiles WHERE userId = X
 *
 *   Step 4: Delete the user:
 *   ─────────────────────────────────────────────────────────────
 *   13. Delete from users WHERE id = X
 *
 * VISUAL REPRESENTATION:
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                         ROOT TABLES (Level 0)                       │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 *        users              urls        interactionTypes
 *          │                 │                │
 *   ┌──────┴─────────────────┴────────────────┴──────────────────────────┐
 *   │                      LEVEL 1 TABLES                                │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 *          │
 *          ├──► userProfiles
 *          │
 *          ├──► usersUrls ────────► urlHashes
 *          │
 *          ├──► follows [DEPRECATED]
 *          │
 *          └──► decks
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                      LEVEL 2 TABLES                                 │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 *        decks
 *          │
 *          ├──► tags (onDelete: cascade)
 *          │
 *          ├──► deckUrls ─────────► usersUrls
 *          │
 *          ├──► deckFollows ──────► users
 *          │
 *          └──► feeds ────────────► usersUrls, users
 *
 *        usersUrls
 *          │
 *          ├──► deckUrls ─────────► decks
 *          │
 *          ├──► feeds ────────────► users, decks
 *          │
 *          └──► usersUrlsInteractions ──► users, interactionTypes
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                      LEVEL 3 TABLES                                 │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 *        deckUrls + tags
 *          │
 *          └──► deckUrlsTags (composite FK to deckUrls, FK to tags)
 *
 * @end-auto-update-dependency-graph
 */

import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { API_KEY_LENGTH } from "./constants";
import { DECK_ID_LENGTH, generateDeckId } from "./id/deck-id";
import { FEED_ID_LENGTH, generateFeedId } from "./id/feed-id";
import { generateTagId, TAG_ID_LENGTH } from "./id/tag-id";
import { generateUrlId, URL_ID_LENGTH } from "./id/url-id";
import { generateUserId, USER_ID_LENGTH } from "./id/user-id";
import { generateUserProfileId, USER_PROFILE_ID_LENGTH } from "./id/user-profile-id";
import { generateUserUrlId, USER_URL_ID_LENGTH } from "./id/user-url-id";

/**
 * USER PLAN ENUM
 *
 * Defines the pricing plan tiers for users.
 * - free: Default plan with limited decks (3 public, 1 private)
 * - medium: Upgraded plan (10 public, 5 private decks)
 * - pro: Unlimited decks
 */
export const userPlanEnum = pgEnum("user_plan", ["free", "medium", "pro"]);

export type UserPlan = (typeof userPlanEnum.enumValues)[number];

/**
 * URLS
 *
 * `compoundHash` is a hash of url, title, image url. Even if image url is not present, hash will be created without it.
 *                It is used to identify the url uniquely and to tell that the same url, that has been already added,
 *                most likely changed its title or image url, and the old one(s) should be updated.
 * `metadata` is a jsonb object that contains the metadata of the url.
 */
export const urls = pgTable("urls", {
  id: char("id", { length: URL_ID_LENGTH })
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateUrlId()),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  url: text("url").notNull(),
  compoundHash: char("compound_hash", { length: 64 }).unique().notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
});

export type Url = InferSelectModel<typeof urls>;

export const urlHashes = pgTable(
  "url_hashes",
  {
    compoundHash: char("compound_hash", { length: 64 })
      .primaryKey()
      .notNull()
      .references(() => urls.compoundHash, { onDelete: "restrict" }),
    // Hash of the URL alone, must not be unique, as the compound hash is the unique one
    urlHash: char("url_hash", { length: 40 }).notNull(),
    // How many times urlHash with combination of compoundHash has been used.
    // When the same urlHash is used with different compoundHash, it means the same URL
    // has different metadata (that are used to generate compoundHash), and we can tell
    // that a URL (urlHash) has been shared multiple times differently.
    // Ideally, we want every unique urlHash value appearing only once in this table.
    // If it will be more, use url_hashes_compound_hashes_counts for the count.
    count: integer("count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [index().on(table.urlHash)],
);

export type UrlHashes = InferSelectModel<typeof urlHashes>;

/**
 * URL HASHES COMPOUND HASHES COUNTS
 *
 * Tracks how many different compound hashes (different metadata versions) exist for each URL hash.
 * When compoundHashesCount > 1, it indicates the same URL has been added with different metadata
 * (title, image, etc.) and duplicate entries should be merged/updated.
 */
export const urlHashesCompoundHashesCounts = pgTable("url_hashes_compound_hashes_counts", {
  urlHash: char("url_hash", { length: 40 }).primaryKey().notNull(),
  compoundHashesCount: integer("compound_hashes_count").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type UrlHashesCompoundHashesCount = InferSelectModel<typeof urlHashesCompoundHashesCounts>;

/**
 * USERS
 */
export const users = pgTable(
  "users",
  {
    id: char("id", { length: USER_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateUserId()),
    clerkUserId: varchar("clerk_user_id").unique().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    apiKey: char("api_key", { length: API_KEY_LENGTH }),
    plan: userPlanEnum("plan").default("free").notNull(),
    planUpdatedAt: timestamp("plan_updated_at", { withTimezone: true }),
  },
  (table) => [index().on(table.apiKey)],
);

export type User = InferSelectModel<typeof users>;

export const userProfiles = pgTable("user_profiles", {
  id: char("id", { length: USER_PROFILE_ID_LENGTH })
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateUserProfileId()),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  userId: char("user_id", { length: USER_ID_LENGTH })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "restrict" }),
  username: varchar("username").unique().notNull(),
  usernameNormalized: varchar("username_normalized").unique().notNull(),
  imageUrl: text("image_url"),
  followingCount: integer("following_count").default(0).notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  likedCount: bigint("liked_count", { mode: "number" }).default(0).notNull(),
  urlsCount: integer("urls_count").default(0).notNull(),
});

export type UserProfile = InferSelectModel<typeof userProfiles>;

/**
 * USERS URLS
 *
 * Represents a user's relationship with a URL. This is the primary table queried for user feeds.
 * `isDeleted` indicates whether this user-URL relationship has been soft-deleted. Deleted entries should not appear in feeds.
 */
export const usersUrls = pgTable(
  "users_urls",
  {
    id: char("id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateUserUrlId()),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    urlId: char("url_id", { length: URL_ID_LENGTH })
      .notNull()
      .references(() => urls.id, { onDelete: "restrict" }),
    likesCount: integer("likes_count").default(0).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
  },
  (table) => [
    index().on(table.userId),
    index().on(table.urlId),
    // Partial index for non-deleted entries - most queries filter by isDeleted = false
    // This index significantly improves feed query performance
    index()
      .on(table.id)
      .where(sql`is_deleted = false`),
  ],
);

export type UserUrl = InferSelectModel<typeof usersUrls>;

/**
 * @deprecated This table is deprecated and will be removed in a future release.
 *
 * User-follows have been replaced by deck-follows (see `deckFollows` table).
 * Following now happens at the deck level, not the user level.
 *
 * DO NOT add new code that writes to this table.
 * DO NOT add new code that reads from this table.
 *
 * The `userProfiles.followersCount` now represents unique deck followers
 * (users who follow at least one of this user's public decks).
 *
 * Migration status:
 * - Phase 8 (complete): UI removed, router removed, deprecation added, feeds.deckId NOT NULL
 * - Phase 10 (future): Drop this table and its relations
 */
export const follows = pgTable(
  "follows",
  {
    followerId: char("follower_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    followingId: char("following_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index().on(table.followerId),
    index().on(table.followingId),
  ],
);

/**
 * @deprecated See deprecation note on `follows` table above.
 */
export type Follow = InferSelectModel<typeof follows>;

/**
 * DECKS
 *
 * A Deck is a named, curated collection of URLs with rich metadata.
 * Users can create multiple decks, make them public or private,
 * and let others follow specific decks.
 *
 * `metadata` is a JSONB object containing customizable appearance properties:
 *   - description: string (optional) - Deck description
 *   - imageUrl: string (optional) - Cover/hero image URL
 *   - color: string (optional) - Accent color in hex format (#FF5733)
 *   - ... extensible for future properties without migrations
 */
export const decks = pgTable(
  "decks",
  {
    id: char("id", { length: DECK_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateDeckId()),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    // Identity (core, frequently queried)
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),

    // Flexible metadata (validated at app layer via Zod schema)
    metadata: jsonb("metadata").default({}).notNull(),

    // Settings
    isPublic: boolean("is_public").default(true).notNull(),

    // Denormalized counts
    urlsCount: integer("urls_count").default(0).notNull(),
    followersCount: integer("followers_count").default(0).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),

    // Pending deletion (soft delete with grace period)
    // NULL = active deck, timestamp = scheduled for hard deletion after this time
    scheduledForDeletionAt: timestamp("scheduled_for_deletion_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.userId, table.slug),
    index().on(table.userId),
    index().on(table.isPublic).where(sql`is_public = true`),
    // Partial index for active (non-pending-deletion) decks
    index()
      .on(table.id)
      .where(sql`scheduled_for_deletion_at IS NULL`),
  ],
);

export type Deck = InferSelectModel<typeof decks>;

/**
 * TAGS
 *
 * Tags belong to decks (not users). Each deck has its own independent tag set.
 * This enables different tags for different contexts (e.g., gaming deck vs cooking deck).
 *
 * `name` is normalized (lowercase, trimmed) for global search across all decks.
 * `displayName` preserves the original casing for display purposes.
 *
 * Global search example: WHERE tags.name = 'gaming' finds all decks with that tag.
 */
export const tags = pgTable(
  "tags",
  {
    id: char("id", { length: TAG_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateTagId()),
    deckId: char("deck_id", { length: DECK_ID_LENGTH })
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    name: varchar("name", { length: 50 }).notNull(), // normalized: lowercase, trimmed
    displayName: varchar("display_name", { length: 50 }).notNull(), // original casing
    urlsCount: integer("urls_count").default(0).notNull(),
  },
  (table) => [
    unique().on(table.deckId, table.name),
    index().on(table.deckId),
    index().on(table.name), // for global tag search
  ],
);

export type Tag = InferSelectModel<typeof tags>;

/**
 * DECK URLS
 *
 * Junction table: URLs in Decks.
 * A URL can be in multiple decks.
 */
export const deckUrls = pgTable(
  "deck_urls",
  {
    deckId: char("deck_id", { length: DECK_ID_LENGTH })
      .notNull()
      .references(() => decks.id, { onDelete: "restrict" }),
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .references(() => usersUrls.id, { onDelete: "restrict" }),
    addedAt: timestamp("added_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [primaryKey({ columns: [table.deckId, table.userUrlId] }), index().on(table.userUrlId)],
);

export type DeckUrl = InferSelectModel<typeof deckUrls>;

/**
 * DECK URLS TAGS
 *
 * Junction table linking tags to deck-URL associations.
 * Tags are now per deck-URL, not per userUrl, enabling different tags
 * for the same URL in different decks.
 */
export const deckUrlsTags = pgTable(
  "deck_urls_tags",
  {
    deckId: char("deck_id", { length: DECK_ID_LENGTH }).notNull(),
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH }).notNull(),
    tagId: char("tag_id", { length: TAG_ID_LENGTH })
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    tagOrder: smallint("tag_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.deckId, table.userUrlId, table.tagId] }),
    // Composite FK to deck_urls - ensures deck-URL association exists
    // Note: Drizzle doesn't support composite FK directly, enforced at DB level
    index().on(table.deckId, table.userUrlId),
    index().on(table.tagId),
  ],
);

export type DeckUrlTag = InferSelectModel<typeof deckUrlsTags>;

/**
 * DECK FOLLOWS
 *
 * Users can follow public decks to see their URLs in their feed.
 * Replaces the user-follows model with deck-follows for more granular control.
 */
export const deckFollows = pgTable(
  "deck_follows",
  {
    deckId: char("deck_id", { length: DECK_ID_LENGTH })
      .notNull()
      .references(() => decks.id, { onDelete: "restrict" }),
    followerId: char("follower_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.deckId, table.followerId] }),
    index().on(table.followerId),
    index().on(table.deckId),
  ],
);

export type DeckFollow = InferSelectModel<typeof deckFollows>;

/**
 * FEEDS
 *
 * Fan-out table for user feeds. When a URL is added to a public deck,
 * feed entries are created for all deck followers.
 *
 * `deckId` tracks which deck the URL came from, enabling:
 *   - Showing deck badge in feed ("From: Free Games")
 *   - Filtering feed by deck
 *   - Handling same URL in multiple followed decks (separate entries)
 */
export const feeds = pgTable(
  "feeds",
  {
    id: char("id", { length: FEED_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateFeedId()),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .references(() => usersUrls.id, { onDelete: "restrict" }),
    deckId: char("deck_id", { length: DECK_ID_LENGTH })
      .notNull()
      .references(() => decks.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    index().on(table.userId, table.createdAt.desc()),
    index().on(table.userUrlId),
    index().on(table.userId, table.deckId), // Filter feed by deck
  ],
);

export type Feed = InferSelectModel<typeof feeds>;

/**
 * INTERACTION TYPES LOOKUP TABLE
 */
export const interactionTypes = pgTable("interaction_types", {
  id: smallint("id").notNull().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export type InteractionType = InferSelectModel<typeof interactionTypes>;

export const usersUrlsInteractions = pgTable(
  "users_urls_interactions",
  {
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .references(() => usersUrls.id, { onDelete: "restrict" }),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    interactionTypeId: smallint("interaction_type_id")
      .notNull()
      .references(() => interactionTypes.id),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userUrlId, table.userId, table.interactionTypeId] }),
    // Optimized index for checking if a user liked a specific URL (used in feed queries)
    // The partial index filters to only LIKED interactions (interactionTypeId = 1) for better performance
    index()
      .on(table.userUrlId, table.userId)
      .where(sql`interaction_type_id = 1`),
  ],
);

export type UserUrlInteraction = InferSelectModel<typeof usersUrlsInteractions>;

export const feedsRelations = relations(feeds, ({ one }) => ({
  users: one(users, {
    fields: [feeds.userId],
    references: [users.id],
  }),
  userUrls: one(usersUrls, {
    fields: [feeds.userUrlId],
    references: [usersUrls.id],
  }),
  deck: one(decks, {
    fields: [feeds.deckId],
    references: [decks.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  urls: many(usersUrls),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  feeds: many(feeds),
  decks: many(decks),
  deckFollows: many(deckFollows),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const urlsRelations = relations(urls, ({ one, many }) => ({
  usersUrls: many(usersUrls),
  urlHashes: one(urlHashes, {
    fields: [urls.compoundHash],
    references: [urlHashes.compoundHash],
  }),
}));

export const urlHashesRelations = relations(urlHashes, ({ one }) => ({
  url: one(urls, {
    fields: [urlHashes.compoundHash],
    references: [urls.compoundHash],
  }),
}));

export const usersUrlsRelations = relations(usersUrls, ({ one, many }) => ({
  user: one(users, {
    fields: [usersUrls.userId],
    references: [users.id],
  }),
  url: one(urls, {
    fields: [usersUrls.urlId],
    references: [urls.id],
  }),
  feeds: many(feeds),
  deckUrls: many(deckUrls),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  deck: one(decks, {
    fields: [tags.deckId],
    references: [decks.id],
  }),
  deckUrls: many(deckUrlsTags),
}));

export const deckUrlsTagsRelations = relations(deckUrlsTags, ({ one }) => ({
  deckUrl: one(deckUrls, {
    fields: [deckUrlsTags.deckId, deckUrlsTags.userUrlId],
    references: [deckUrls.deckId, deckUrls.userUrlId],
  }),
  tag: one(tags, {
    fields: [deckUrlsTags.tagId],
    references: [tags.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "followers",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  urls: many(deckUrls),
  tags: many(tags),
  followers: many(deckFollows),
  feeds: many(feeds),
}));

export const deckUrlsRelations = relations(deckUrls, ({ one, many }) => ({
  deck: one(decks, {
    fields: [deckUrls.deckId],
    references: [decks.id],
  }),
  userUrl: one(usersUrls, {
    fields: [deckUrls.userUrlId],
    references: [usersUrls.id],
  }),
  tags: many(deckUrlsTags),
}));

export const deckFollowsRelations = relations(deckFollows, ({ one }) => ({
  deck: one(decks, {
    fields: [deckFollows.deckId],
    references: [decks.id],
  }),
  follower: one(users, {
    fields: [deckFollows.followerId],
    references: [users.id],
  }),
}));

export const usersUrlsInteractionsRelations = relations(usersUrlsInteractions, ({ one }) => ({
  userUrl: one(usersUrls, {
    fields: [usersUrlsInteractions.userUrlId],
    references: [usersUrls.id],
  }),
  user: one(users, {
    fields: [usersUrlsInteractions.userId],
    references: [users.id],
  }),
  interactionType: one(interactionTypes, {
    fields: [usersUrlsInteractions.interactionTypeId],
    references: [interactionTypes.id],
  }),
}));

export const interactionTypesRelations = relations(interactionTypes, ({ many }) => ({
  interactions: many(usersUrlsInteractions),
}));
