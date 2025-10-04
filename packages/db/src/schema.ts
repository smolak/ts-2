import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
  bigint,
  char,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { API_KEY_LENGTH } from "./constants";
import { CATEGORY_ID_LENGTH, generateCategoryId } from "./id/category-id";
import { FEED_ID_LENGTH, generateFeedId } from "./id/feed-id";
import { generateUrlId, URL_ID_LENGTH } from "./id/url-id";
import { generateUserId, USER_ID_LENGTH } from "./id/user-id";
import { generateUserProfileId, USER_PROFILE_ID_LENGTH } from "./id/user-profile-id";
import { generateUserUrlId, USER_URL_ID_LENGTH } from "./id/user-url-id";

/**
 * CATEGORIES
 *
 * Users can create categories and assign them to urls.
 * URLs can have multiple categories.
 */
export const categories = pgTable(
  "categories",
  {
    id: char("id", { length: CATEGORY_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateCategoryId()),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
    name: varchar("name").notNull(),
    urlsCount: integer("urls_count").default(0).notNull(),
  },
  (table) => [unique().on(table.userId, table.name), index().on(table.userId)],
);

export type Category = InferSelectModel<typeof categories>;

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
      .references(() => urls.compoundHash, { onDelete: "cascade" }),
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
 *
 * TODO: add role, as it will be used for basic/pro users
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
    .references(() => users.id, { onDelete: "cascade" }),
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
      .references(() => users.id, { onDelete: "cascade" }),
    urlId: char("url_id", { length: URL_ID_LENGTH })
      .notNull()
      .references(() => urls.id, { onDelete: "cascade" }),
    likesCount: integer("likes_count").default(0).notNull(),
  },
  (table) => [index().on(table.userId), index().on(table.urlId)],
);

export type UserUrl = InferSelectModel<typeof usersUrls>;

/**
 * USER URLS CATEGORIES
 */
export const userUrlsCategories = pgTable(
  "user_urls_categories",
  {
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .references(() => usersUrls.id, { onDelete: "cascade" }),
    categoryId: char("category_id", { length: CATEGORY_ID_LENGTH })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    categoryOrder: smallint("category_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userUrlId, table.categoryId] }),
    index().on(table.userUrlId),
    index().on(table.categoryId),
  ],
);

export type UserUrlCategory = InferSelectModel<typeof userUrlsCategories>;

export const follows = pgTable(
  "follows",
  {
    followerId: char("follower_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: char("following_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index().on(table.followerId),
    index().on(table.followingId),
  ],
);

export type Follow = InferSelectModel<typeof follows>;

export const feeds = pgTable(
  "feeds",
  {
    id: char("id", { length: FEED_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateFeedId()),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .references(() => usersUrls.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [index().on(table.userId, table.createdAt.desc()), index().on(table.userUrlId)],
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
      .references(() => usersUrls.id, { onDelete: "cascade" }),
    userId: char("user_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interactionTypeId: smallint("interaction_type_id")
      .notNull()
      .references(() => interactionTypes.id),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userUrlId, table.userId, table.interactionTypeId] }),
    // Optimized index for checking if a user liked a specific URL (used in feed queries)
    // The partial index filters to only LIKED interactions (interactionTypeId = 1) for better performance
    index().on(table.userUrlId, table.userId).where(sql`interaction_type_id = 1`),
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
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  urls: many(usersUrls),
  categories: many(categories),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  feeds: many(feeds),
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
  categories: many(userUrlsCategories),
  feeds: many(feeds),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  urls: many(userUrlsCategories),
}));

export const userUrlsCategoriesRelations = relations(userUrlsCategories, ({ one }) => ({
  usersUrl: one(usersUrls, {
    fields: [userUrlsCategories.userUrlId],
    references: [usersUrls.id],
  }),
  category: one(categories, {
    fields: [userUrlsCategories.categoryId],
    references: [categories.id],
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
