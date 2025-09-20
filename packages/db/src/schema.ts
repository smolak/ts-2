import { generateUrlId, URL_ID_LENGTH } from "@repo/url/id/generate-url-id";

import { type InferSelectModel, sql } from "drizzle-orm";
import { char, jsonb, pgTableCreator, text, timestamp } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
const createTable = pgTableCreator((name) => `urlshare_${name}`);

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
