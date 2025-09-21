import { type InferSelectModel, sql } from "drizzle-orm";
import {
  char,
  index,
  integer,
  jsonb,
  pgTableCreator,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { API_KEY_LENGTH } from "./constants";
import { CATEGORY_ID_LENGTH, generateCategoryId } from "./id/category-id";
import { generateUrlId, URL_ID_LENGTH } from "./id/url-id";

const createTable = pgTableCreator((name) => `urlshare_${name}`);

export const categories = createTable(
  "categories",
  {
    id: char("id", { length: CATEGORY_ID_LENGTH })
      .notNull()
      .primaryKey()
      .$defaultFn(() => generateCategoryId()),
    userId: uuid("user_id")
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

export const urls = createTable("urls", {
  id: char("id", { length: URL_ID_LENGTH })
    .notNull()
    .primaryKey()
    .$defaultFn(() => generateUrlId()),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  url: text("url").notNull(),
  // This is a hash of url, title, image url. Even if image url is not present, hash will be created without it
  compoundHash: char("compound_hash", { length: 64 }).unique().notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
});

export type Url = InferSelectModel<typeof urls>;

// TODO: add role, as it will be used for basic/pro users
export const users = createTable("users", {
  id: uuid("id").notNull().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  apiKey: char("api_key", { length: API_KEY_LENGTH }),
});

export type User = InferSelectModel<typeof users>;
