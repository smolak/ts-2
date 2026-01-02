# Feature Plan: Decks (Multi-Profile URL Organization)

> **Status**: Planning
> **Created**: December 7, 2025
> **Last Updated**: December 7, 2025

## Table of Contents

1. [Overview](#overview)
2. [Key Decisions](#key-decisions)
3. [Schema Design](#schema-design)
4. [File Structure](#file-structure)
5. [API Procedure Specifications](#api-procedure-specifications)
6. [Migration Strategy](#migration-strategy)
7. [Implementation Phases](#implementation-phases)
8. [Decisions Made](#decisions-made)
9. [Testing Strategy](#testing-strategy)
10. [Edge Cases & Considerations](#edge-cases--considerations)
11. [Remove Soft Delete for URLs](#remove-soft-delete-for-urls)
12. [Database Query Performance Audit](#database-query-performance-audit)
13. [Security Fixes (Priority)](#security-fixes-priority)
14. [Phase 9: Integration Tests Infrastructure](#phase-9-integration-tests-infrastructure-for-trpc-procedures)
15. [Feed Query Cleanup: Remove Tag Filtering](#feed-query-cleanup-remove-tag-filtering)
16. [User Account Deletion Strategy](#user-account-deletion-strategy)
17. [Phase 10: Drop Deprecated follows Table](#phase-10-drop-deprecated-follows-table)
18. [Refactor: Rename usernameNormalized to slug](#refactor-rename-usernamenormalized-to-slug-in-user-profiles)
19. [Refactor: Standardize name / display_name Column Convention](#refactor-standardize-name--display_name-column-convention)
20. [Cleanup: Remove Unnecessary Defensive Checks After Drizzle Inserts](#cleanup-remove-unnecessary-defensive-checks-after-drizzle-inserts)
21. [Utility: International Display Name Normalization](#utility-international-display-name-normalization)
22. [Convention: Keep Procedure Schemas Inline](#convention-keep-procedure-schemas-inline)
23. [Generate App Rules and Regulations](#generate-app-rules-and-regulations)
24. [Add typecheck Scripts to All Packages](#add-typecheck-scripts-to-all-packages)

---

## Overview

### Problem Statement

Users want to organize their URLs into separate contexts:
- Personal bookmarks
- Topic-specific collections (free games, movies, news, etc.)
- Public vs private content
- Different "personas" for different audiences

### Solution: Decks

A **Deck** is a named, curated collection of URLs with rich metadata. Users can:
- Create multiple decks under one account
- Add URLs to multiple decks
- Make decks public (followable) or private
- Let others follow specific decks (not the user directly)

### Why "Deck"?

- Brand alignment with **LinkDeck**
- Implies a curated set (like a deck of cards)
- Not overloaded like "profile" or "collection"
- Unique and memorable

---

## Key Decisions

### 1. Decks as an Additional Layer (Not Replacement)

```
users → users_urls → urls        (existing - ownership)
            ↓
      deck_urls → decks          (new - organization)
```

- `users_urls` remains the primary ownership record
- Decks group existing `users_urls` entries
- A URL can exist without being in any deck
- A URL can be in multiple decks

### 2. Follow Decks, Not Users

**Old model (removed):**
```
follows (follower_id → user_id)
└── Problem: Need to filter by public/private collections everywhere
```

**New model:**
```
deck_follows (follower_id → deck_id)
└── Clean: Private decks simply can't be followed
```

**Benefits:**
- No privacy edge cases in code
- More granular for followers ("I only want your gaming content")
- Simpler feed queries
- Privacy is structural, not conditional

### 3. Tags Still Work Independently

| Feature | Tags | Decks |
|---------|------|-------|
| Purpose | Fine-grained categorization | Curated "playlists" |
| Metadata | Just a name | Title, description, image, etc. |
| Followable | No | Yes (if public) |
| Public page | No | Yes (`/@username/slug`) |

Users can use both: A "Free Games" deck where URLs are also tagged `#epic`, `#steam`, `#gog`.

### 4. Feed Population

When a URL is added to a public deck:
1. Create `deck_urls` record
2. Fan-out: Insert `feeds` records for all deck followers (with `deck_id` for filtering/display)

```sql
INSERT INTO feeds (user_id, user_url_id, deck_id, created_at)
SELECT df.follower_id, :user_url_id, :deck_id, NOW()
FROM deck_follows df
WHERE df.deck_id = :deck_id;
```

**Benefits of storing `deck_id` in feeds:**
- Show deck badge in feed ("From: Free Games 🎮")
- Filter feed by deck: `WHERE deck_id = :deck_id`
- Same URL in multiple followed decks creates separate feed entries (correct behavior)

---

## Schema Design

### New Tables

```sql
-- Decks with rich metadata
CREATE TABLE decks (
  id CHAR(26) PRIMARY KEY,  -- using existing ID generation pattern
  user_id CHAR(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Identity (core, frequently queried)
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,  -- URL-friendly: "free-games"
  
  -- Flexible metadata as JSONB (validated at app layer)
  -- Contains: description, imageUrl, color, and future extensible properties
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  -- Settings
  is_public BOOLEAN DEFAULT true NOT NULL,
  
  -- Denormalized counts
  urls_count INTEGER DEFAULT 0 NOT NULL,
  followers_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ,
  
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_is_public ON decks(is_public) WHERE is_public = true;

-- Junction: URLs in Decks
CREATE TABLE deck_urls (
  deck_id CHAR(26) NOT NULL REFERENCES decks(id) ON DELETE RESTRICT,
  user_url_id CHAR(26) NOT NULL REFERENCES users_urls(id) ON DELETE RESTRICT,
  added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  PRIMARY KEY (deck_id, user_url_id)
);

CREATE INDEX idx_deck_urls_user_url_id ON deck_urls(user_url_id);

-- Deck Follows (replaces user follows)
CREATE TABLE deck_follows (
  deck_id CHAR(26) NOT NULL REFERENCES decks(id) ON DELETE RESTRICT,
  follower_id CHAR(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  PRIMARY KEY (deck_id, follower_id)
);

CREATE INDEX idx_deck_follows_follower_id ON deck_follows(follower_id);
CREATE INDEX idx_deck_follows_deck_id ON deck_follows(deck_id);

-- Modify existing feeds table to include deck_id
ALTER TABLE feeds ADD COLUMN deck_id CHAR(26) NOT NULL REFERENCES decks(id) ON DELETE RESTRICT;
CREATE INDEX idx_feeds_user_deck ON feeds(user_id, deck_id);
```

### ID Generation

Create `packages/db/src/id/deck-id.ts`:

```typescript
import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const DECK_ID_PREFIX = "deck_" as const;
export const DECK_ID_LENGTH = DEFAULT_ID_LENGTH + DECK_ID_PREFIX.length;

export const generateDeckId = (): string => generateId(DECK_ID_PREFIX);

export type DeckId = z.infer<typeof deckIdSchema>;

export const deckIdSchema = z
  .string()
  .trim()
  .startsWith(DECK_ID_PREFIX, { message: "ID passed is not a deck ID." })
  .length(DECK_ID_LENGTH, { message: "Wrong ID size." });
```

Export from `packages/db/src/id/index.ts` (add to existing exports).

### Validation Schemas

Create `packages/deck/` package with validation schemas:

```typescript
// packages/deck/src/schemas/deck-name.schema.ts
import { z } from "zod";

export const DECK_NAME_MAX_LENGTH = 50;

export const deckNameSchema = z
  .string()
  .trim()
  .min(1, "Deck name is required.")
  .max(DECK_NAME_MAX_LENGTH, `Deck name cannot exceed ${DECK_NAME_MAX_LENGTH} characters.`);
```

```typescript
// packages/deck/src/schemas/deck-slug.schema.ts
import { z } from "zod";

export const DECK_SLUG_MAX_LENGTH = 50;
export const DECK_SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789-";

export const deckSlugSchema = z
  .string()
  .trim()
  .min(1, "Deck slug is required.")
  .max(DECK_SLUG_MAX_LENGTH, `Slug cannot exceed ${DECK_SLUG_MAX_LENGTH} characters.`)
  .regex(
    new RegExp(`^[${DECK_SLUG_ALPHABET}]+$`),
    "Slug can only contain lowercase letters, numbers, and hyphens."
  )
  .refine((val) => !val.startsWith("-") && !val.endsWith("-"), {
    message: "Slug cannot start or end with a hyphen.",
  });
```

```typescript
// packages/deck/src/schemas/deck-metadata.schema.ts
// Unified metadata schema for flexible deck customization
import { z } from "zod";

export const DECK_DESCRIPTION_MAX_LENGTH = 500;

export const deckMetadataSchema = z.object({
  description: z
    .string()
    .trim()
    .max(DECK_DESCRIPTION_MAX_LENGTH, `Description cannot exceed ${DECK_DESCRIPTION_MAX_LENGTH} characters.`)
    .optional()
    .nullable(),
  imageUrl: z.string().url("Invalid image URL.").optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g., #FF5733).")
    .optional()
    .nullable(),
  // Extensible: add new properties here without DB migrations
});

export type DeckMetadata = z.infer<typeof deckMetadataSchema>;
```

### Drizzle Schema

```typescript
// In packages/db/src/schema.ts

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
    // Contains: description, imageUrl, color, and future extensible properties
    metadata: jsonb("metadata").default({}).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    urlsCount: integer("urls_count").default(0).notNull(),
    followersCount: integer("followers_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(table.userId, table.slug),
    index().on(table.userId),
    index().on(table.isPublic).where(sql`is_public = true`),
  ]
);

export const deckUrls = pgTable(
  "deck_urls",
  {
    deckId: char("deck_id", { length: DECK_ID_LENGTH })
      .notNull()
      .references(() => decks.id, { onDelete: "restrict" }),
    userUrlId: char("user_url_id", { length: USER_URL_ID_LENGTH })
      .notNull()
      .references(() => usersUrls.id, { onDelete: "restrict" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.deckId, table.userUrlId] }),
    index().on(table.userUrlId),
  ]
);

export const deckFollows = pgTable(
  "deck_follows",
  {
    deckId: char("deck_id", { length: DECK_ID_LENGTH })
      .notNull()
      .references(() => decks.id, { onDelete: "restrict" }),
    followerId: char("follower_id", { length: USER_ID_LENGTH })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.deckId, table.followerId] }),
    index().on(table.followerId),
    index().on(table.deckId),
  ]
);

// Type exports (add to packages/db/src/types.ts)
export type Deck = InferSelectModel<typeof decks>;
export type DeckUrl = InferSelectModel<typeof deckUrls>;
export type DeckFollow = InferSelectModel<typeof deckFollows>;
```

### Drizzle Relations

Add to `packages/db/src/schema.ts` after table definitions:

```typescript
// Deck relations
export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  urls: many(deckUrls),
  followers: many(deckFollows),
}));

export const deckUrlsRelations = relations(deckUrls, ({ one }) => ({
  deck: one(decks, {
    fields: [deckUrls.deckId],
    references: [decks.id],
  }),
  userUrl: one(usersUrls, {
    fields: [deckUrls.userUrlId],
    references: [usersUrls.id],
  }),
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

// Update usersRelations to include decks
export const usersRelations = relations(users, ({ one, many }) => ({
  // ... existing relations ...
  decks: many(decks),
  deckFollows: many(deckFollows),
}));

// Update usersUrlsRelations to include deckUrls
export const usersUrlsRelations = relations(usersUrls, ({ one, many }) => ({
  // ... existing relations ...
  deckUrls: many(deckUrls),
}));

// Update feedsRelations to include deck
export const feedsRelations = relations(feeds, ({ one }) => ({
  // ... existing relations ...
  deck: one(decks, {
    fields: [feeds.deckId],
    references: [decks.id],
  }),
}));

// Update decksRelations to include feeds
export const decksRelations = relations(decks, ({ one, many }) => ({
  // ... existing relations ...
  feeds: many(feeds),
}));
```

### Feeds Table Modification

Add `deck_id` column to existing `feeds` table for deck filtering and display:

```typescript
// Update feeds table in packages/db/src/schema.ts
export const feeds = pgTable(
  "feeds",
  {
    id: ...,
    userId: ...,
    userUrlId: ...,
    deckId: char("deck_id", { length: DECK_ID_LENGTH })  // NEW
      .notNull()
      .references(() => decks.id, { onDelete: "restrict" }),
    createdAt: ...,
    updatedAt: ...,
  },
  (table) => [
    index().on(table.userId, table.createdAt.desc()),
    index().on(table.userUrlId),
    index().on(table.userId, table.deckId),  // NEW: Filter feed by deck
  ],
);
```

### Updated Dependency Graph

```
Level 0 - ROOT TABLES:
  - users
  - urls
  - interactionTypes
  - urlHashesCompoundHashesCounts

Level 1 - DEPEND ON ROOTS:
  - userProfiles → users
  - tags → users
  - urlHashes → urls
  - usersUrls → users, urls
  - decks → users                    // NEW

Level 2 - DEPEND ON LEVEL 1:
  - userUrlsTags → usersUrls, tags
  - feeds → users, usersUrls, decks  // MODIFIED: added decks dependency
  - usersUrlsInteractions → usersUrls, users, interactionTypes
  - deckUrls → decks, usersUrls      // NEW
  - deckFollows → decks, users       // NEW

DEPRECATED (to remove):
  - follows → users
```

---

## Migration Strategy

### Phase 1: Add New Tables (Non-Breaking)

1. Create migration for `decks`, `deck_urls`, `deck_follows`
2. Add Drizzle schema definitions
3. Add ID generators
4. Deploy — no existing functionality affected

### Phase 2: Implement Deck Features

1. CRUD for decks
2. Add/remove URLs from decks
3. Follow/unfollow decks
4. Update feed population logic (dual-write: both old and new)

### Phase 3: Migrate Existing Data

1. Create a "Default" public deck for each user with existing URLs
2. Migrate existing `follows` to `deck_follows` (follow all public decks of followed users)
3. Verify data integrity

### Phase 4: Deprecate Old Follows

1. Remove user follow UI
2. Update all queries to use deck follows
3. Stop writing to `follows` table
4. (Later) Drop `follows` table

---

## File Structure

### Package: `packages/deck/`

```
packages/deck/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── id/
    │   └── deck-id.ts          # ID generation (or keep in @repo/db)
    ├── schemas/
    │   ├── deck-name.schema.ts
    │   ├── deck-slug.schema.ts
    │   └── deck-metadata.schema.ts  # Unified metadata (description, imageUrl, color, ...)
    ├── config/
    │   ├── deck-limits.ts      # Plan limits & canCreateDeck()
    │   └── deck-limits.test.ts
    └── dto/
        └── deck.dto.ts
```

### Feature: `apps/web/src/features/deck/`

```
apps/web/src/features/deck/
├── router/
│   ├── decks.ts                 # Router aggregation
│   └── procedures/
│       ├── create-deck.ts
│       ├── update-deck.ts
│       ├── delete-deck.ts
│       ├── get-user-decks.ts
│       ├── get-deck-by-slug.ts
│       ├── get-public-decks.ts
│       ├── add-url-to-deck.ts
│       ├── remove-url-from-deck.ts
│       ├── get-deck-urls.ts
│       ├── toggle-follow-deck.ts
│       └── get-followed-decks.ts
├── schemas/
│   ├── create-deck.schema.ts
│   ├── update-deck.schema.ts
│   └── delete-deck.schema.ts
├── stores/
│   └── use-decks-store.ts       # Zustand store for client state
└── ui/
    ├── settings/                 # /settings/decks page
    │   ├── index.tsx
    │   ├── deck-list.tsx
    │   ├── deck-list-item.tsx
    │   ├── create-deck-form.tsx
    │   └── edit-deck-form.tsx
    ├── deck-picker/              # For URL sharing flow
    │   ├── index.tsx
    │   └── deck-picker-list.tsx
    └── public-deck/              # /@username/slug page
        ├── deck-header.tsx
        ├── deck-url-list.tsx
        └── follow-deck-button.tsx
```

---

## API Procedure Specifications

### Deck CRUD

#### `createDeck`

```typescript
// Input
const createDeckSchema = z.object({
  name: deckNameSchema,
  slug: deckSlugSchema,
  description: deckDescriptionSchema.optional(),
  imageUrl: z.string().url().optional().nullable(),
  color: deckColorSchema.optional(),
  isPublic: z.boolean().default(true),
});

// Output
type CreateDeckResult = {
  deckId: Deck["id"];
  slug: Deck["slug"];
};

// Behavior
// 1. Get user's plan from users table
// 2. Count user's current public and private decks
// 3. Check limits using canCreateDeck() from deck-limits config
// 4. If allowed, create deck
// 5. If not allowed, return FORBIDDEN with upgrade message

// Errors
// - FORBIDDEN: "You've reached the maximum of X decks on the Y plan."
// - FORBIDDEN: "You've reached the maximum of X public decks on the Y plan."
// - FORBIDDEN: "You've reached the maximum of X private decks on the Y plan."
// - BAD_REQUEST: "Deck with this slug already exists."
// - BAD_REQUEST: "Deck could not be created."
```

#### `updateDeck`

```typescript
// Input
const updateDeckSchema = z.object({
  deckId: deckIdSchema,
  name: deckNameSchema.optional(),
  slug: deckSlugSchema.optional(),
  description: deckDescriptionSchema.optional(),
  imageUrl: z.string().url().optional().nullable(),
  color: deckColorSchema.optional(),
  isPublic: z.boolean().optional(),
});

// Output
type UpdateDeckResult = {
  deckId: Deck["id"];
  slug: Deck["slug"];
};

// Behavior (when changing visibility)
// 1. If isPublic is changing, check limits for the new visibility
// 2. Private → Public: Check public deck limit
// 3. Public → Private: Check private deck limit
// 4. If limit exceeded, return FORBIDDEN with upgrade message

// Errors
// - NOT_FOUND: "Deck not found."
// - FORBIDDEN: "You can only update your own decks."
// - FORBIDDEN: "You've reached the maximum of X public decks on the Y plan."
// - FORBIDDEN: "You've reached the maximum of X private decks on the Y plan."
// - BAD_REQUEST: "Deck with this slug already exists."
```

#### `deleteDeck`

```typescript
// Input
const deleteDeckSchema = z.object({
  deckId: deckIdSchema,
});

// Output
type DeleteDeckResult = {
  deleted: true;
};

// Behavior
// 1. Delete all deck_urls entries for this deck
// 2. Delete all deck_follows entries for this deck
// 3. Delete the deck itself
// Note: Does NOT delete the underlying users_urls records

// Errors
// - NOT_FOUND: "Deck not found."
// - FORBIDDEN: "You can only delete your own decks."
```

#### `getUserDecks`

```typescript
// Input: none (uses ctx.userId)

// Output
type GetUserDecksResult = Array<{
  id: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  description: Deck["description"];
  imageUrl: Deck["imageUrl"];
  color: Deck["color"];
  isPublic: Deck["isPublic"];
  urlsCount: Deck["urlsCount"];
  followersCount: Deck["followersCount"];
}>;
```

#### `getDeckBySlug`

```typescript
// Input
const getDeckBySlugSchema = z.object({
  username: z.string(),  // Profile username
  slug: deckSlugSchema,
});

// Output
type GetDeckBySlugResult = {
  id: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  description: Deck["description"];
  imageUrl: Deck["imageUrl"];
  color: Deck["color"];
  urlsCount: Deck["urlsCount"];
  followersCount: Deck["followersCount"];
  owner: {
    userId: User["id"];
    username: UserProfile["username"];
    imageUrl: UserProfile["imageUrl"];
  };
  isFollowing: boolean;  // If viewer is following this deck
} | null;

// Notes
// - Only returns public decks for other users
// - Returns private decks if owner is requesting
```

### Deck URLs

#### `addUrlToDeck`

```typescript
// Input
const addUrlToDeckSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
});

// Output
type AddUrlToDeckResult = {
  added: true;
  deckId: Deck["id"];
  urlsCount: Deck["urlsCount"];  // Updated count
};

// Behavior
// 1. Verify deck belongs to user
// 2. Verify userUrl belongs to user
// 3. Insert into deck_urls
// 4. Increment deck.urls_count
// 5. If deck is public: fan-out to feeds of deck followers

// Errors
// - NOT_FOUND: "Deck not found."
// - FORBIDDEN: "You can only add URLs to your own decks."
// - BAD_REQUEST: "URL is already in this deck."
```

#### `removeUrlFromDeck`

```typescript
// Input
const removeUrlFromDeckSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
});

// Output
type RemoveUrlFromDeckResult = {
  removed: true;
  urlsCount: Deck["urlsCount"];
};

// Behavior
// 1. Delete from deck_urls
// 2. Decrement deck.urls_count
// Note: Does NOT delete from feeds (historical record)
```

### Deck Follows

#### `toggleFollowDeck`

```typescript
// Input
const toggleFollowDeckSchema = z.object({
  deckId: deckIdSchema,
});

// Output
type ToggleFollowDeckResult = {
  status: "following" | "unfollowed";
  deckId: Deck["id"];
  followersCount: Deck["followersCount"];
};

// Behavior (follow)
// 1. Insert into deck_follows
// 2. Increment deck.followers_count
// 3. Insert existing deck URLs into user's feed

// Behavior (unfollow)
// 1. Delete from deck_follows
// 2. Decrement deck.followers_count
// Note: Does NOT remove from feeds (historical record)

// Errors
// - NOT_FOUND: "Deck not found."
// - BAD_REQUEST: "Cannot follow private decks."
// - BAD_REQUEST: "Cannot follow your own deck."
```

#### `getFollowedDecks`

```typescript
// Input: none (uses ctx.userId)

// Output
type GetFollowedDecksResult = Array<{
  id: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  imageUrl: Deck["imageUrl"];
  urlsCount: Deck["urlsCount"];
  owner: {
    username: UserProfile["username"];
    imageUrl: UserProfile["imageUrl"];
  };
}>;
```

---

## Implementation Phases

### Phase 1: Database Foundation

**Files to create/modify:**

- [x] `packages/db/src/id/deck-id.ts` - ID generation with validation schema
- [x] `packages/db/src/id/deck-id.test.ts` - Test for deck ID generation
- [x] `packages/db/src/schema.ts` - Add `userPlanEnum` enum type
- [x] `packages/db/src/schema.ts` - Add `plan` and `planUpdatedAt` to `users` table
- [x] `packages/db/src/schema.ts` - Add `decks`, `deckUrls`, `deckFollows` tables
- [x] `packages/db/src/schema.ts` - Add relations for new tables
- [x] `packages/db/src/schema.ts` - Update dependency graph comment at top
- [x] `packages/db/src/schema.ts` - Add `deckId` to `feeds` table (for deck filtering/display)
- [x] `packages/db/src/schema.ts` - Update `feedsRelations` to include deck
- [x] `packages/db/src/types.ts` - Export `Deck`, `DeckUrl`, `DeckFollow`, `UserPlan` types
- [x] `packages/db/supabase/migrations/0006_add_decks_schema.sql` - Migration for user plan, decks tables, and deck_id in feeds
- [x] Run `pnpm db:generate` and `pnpm db:migrate` to apply

**Verification:**
```bash
# After migration, verify tables exist
pnpm db:studio  # Check tables in Drizzle Studio
```

### Phase 2: Validation Package

**Files to create:**

- [x] `packages/deck/package.json` - Package config
- [x] `packages/deck/tsconfig.json` - TypeScript config (extend base)
- [x] `packages/deck/vitest.config.ts` - Vitest config
- [x] `packages/deck/README.md` - Package documentation
- [x] `packages/deck/src/schemas/deck-name.schema.ts` - With tests
- [x] `packages/deck/src/schemas/deck-slug.schema.ts` - With tests
- [x] `packages/deck/src/schemas/deck-metadata.schema.ts` - Unified metadata (description, imageUrl, color, ...) with tests
- [x] `packages/deck/src/config/deck-limits.ts` - Plan limits & enforcement functions
- [x] `packages/deck/src/config/deck-limits.test.ts` - Tests for limit logic
- [x] `packages/deck/src/dto/deck.dto.ts`

### Phase 3: Backend API

**Files to create:**

Router setup:
- [x] `apps/web/src/features/deck/router/decks.ts` - Router aggregation
- [x] `apps/web/src/server/api/root.ts` - Register `decksRouter`

Schemas:
- [x] `apps/web/src/features/deck/schemas/create-deck.schema.ts`
- [x] `apps/web/src/features/deck/schemas/update-deck.schema.ts`
- [x] `apps/web/src/features/deck/schemas/delete-deck.schema.ts`

Procedures (in order of dependency):
- [x] `apps/web/src/features/deck/router/procedures/create-deck.ts`
- [x] `apps/web/src/features/deck/router/procedures/update-deck.ts`
- [x] `apps/web/src/features/deck/router/procedures/delete-deck.ts`
- [x] `apps/web/src/features/deck/router/procedures/get-user-decks.ts`
- [x] `apps/web/src/features/deck/router/procedures/get-deck-by-slug.ts`
- [x] `apps/web/src/features/deck/router/procedures/get-public-decks.ts`
- [x] `apps/web/src/features/deck/router/procedures/add-url-to-deck.ts`
- [x] `apps/web/src/features/deck/router/procedures/remove-url-from-deck.ts`
- [x] `apps/web/src/features/deck/router/procedures/get-deck-urls.ts`
- [x] `apps/web/src/features/deck/router/procedures/toggle-follow-deck.ts`
- [x] `apps/web/src/features/deck/router/procedures/get-followed-decks.ts`

Feed integration:
- [x] `apps/web/src/features/feed/queries/get-user-feed.ts` - Add deck filtering
- [x] Update feed population in `add-url-to-deck.ts` (fan-out to followers)

**Note:** Phase 8 migration complete - `feeds.deckId` is now NOT NULL. All feed entries must be associated with a deck.

### Phase 4: Web UI - Settings

**Files to create:**

- [x] `apps/web/src/features/deck/stores/use-decks-store.ts` - Zustand store
- [x] `apps/web/src/features/deck/ui/settings/index.tsx` - Settings page wrapper
- [x] `apps/web/src/features/deck/ui/settings/deck-list.tsx`
- [x] `apps/web/src/features/deck/ui/settings/deck-list-item.tsx`
- [x] `apps/web/src/features/deck/ui/settings/create-deck-form.tsx`
- [x] `apps/web/src/features/deck/ui/settings/edit-deck.tsx` (renamed from edit-deck-form.tsx)
- [x] `apps/web/src/features/deck/ui/settings/delete-deck.tsx` (renamed from delete-deck-dialog.tsx)
- [x] `apps/web/src/features/deck/ui/settings/deck-limits-usage.tsx` - Shows current usage vs limits
- [ ] `apps/web/src/features/deck/ui/settings/upgrade-prompt.tsx` - CTA when at limit (deferred)
- [x] `apps/web/src/app/settings/decks/page.tsx` - Route page

**Limit enforcement in UI:**
- Show usage indicator: "Public Decks: 2 / 3"
- Disable "Create Public Deck" button when at public limit
- Disable "Create Private Deck" button when at private limit
- Show upgrade CTA when any limit is reached
- When editing deck: disable visibility toggle if switching would exceed limit

### Phase 5: Web UI - Public Deck Page

**Files to create:**

- [x] `apps/web/src/features/deck/ui/public-deck/deck-header.tsx`
- [x] `apps/web/src/features/deck/ui/public-deck/deck-url-list.tsx`
- [x] `apps/web/src/features/deck/ui/public-deck/follow-deck-button.tsx`
- [x] `apps/web/src/app/[username]/[slug]/page.tsx` - Route page

### Phase 6: Web UI - Deck Picker & Integration

**Files to create:**

- [x] `apps/web/src/features/deck/ui/deck-picker/index.tsx`
- [x] `apps/web/src/features/deck/ui/deck-picker/deck-picker-list.tsx`
- [x] `apps/web/src/features/deck/ui/public-decks-grid.tsx` - Public decks grid for profile page
- [x] `apps/web/src/features/deck/ui/deck-selector/index.tsx` - Deck filter for feed
- [x] `apps/web/src/features/deck/router/procedures/get-url-decks.ts` - Get which decks contain a URL

**Files to modify:**

- [x] `apps/web/src/features/feed/ui/user-feed-list/edit-feed-item-modal.tsx` - Include deck picker
- [x] `apps/web/src/app/[username]/page.tsx` - Show public decks grid on profile
- [x] `apps/web/src/features/feed/ui/feed-list-filters.tsx` - Add deck filter
- [x] `apps/web/src/features/feed/ui/user-feed-list/infinite-user-feed.tsx` - Handle deck query param
- [x] `apps/web/src/features/home-page/logged-in-user-content.tsx` - Fetch and pass decks to filters

### Phase 7: Browser Extension

**Files created:**

- [x] `packages/deck/src/api/v1/get-decks.schema.ts` - Response schema for deck API
- [x] `apps/web/src/app/api/v1/deck/route.ts` - GET endpoint for fetching user decks
- [x] `apps/browser-extension/src/entrypoints/popup/hooks/use-decks.ts` - Hook to fetch decks
- [x] `apps/browser-extension/src/entrypoints/popup/deck-picker/index.tsx` - Deck picker component
- [x] `apps/browser-extension/src/entrypoints/popup/deck-picker/deck-picker-list.tsx` - Deck list UI

**Files modified:**

- [x] `apps/web/src/features/url/api/v1/add-url/request-body.schema.ts` - Added deckIds to schema
- [x] `apps/web/src/features/url/api/v1/add-url/index.ts` - Added deck handling and feed fan-out
- [x] `apps/web/src/app/api/v1/url/route.ts` - Pass deckIds to addUrl function
- [x] `apps/browser-extension/src/entrypoints/popup/constants/storage.ts` - Added deck storage keys
- [x] `apps/browser-extension/src/entrypoints/popup/hooks/use-add-url.ts` - Added deckIds parameter
- [x] `apps/browser-extension/src/entrypoints/popup/add-url/index.tsx` - Integrated deck picker with default preference

### Phase 8: Migration & Cleanup

**Migration scripts (one-time):**

```sql
-- Create default "General" deck for each user with existing URLs
INSERT INTO decks (id, user_id, name, slug, is_public, urls_count, created_at)
SELECT 
  generate_deck_id(),  -- Custom function or app-generated
  u.id,
  'General',
  'general',
  true,
  (SELECT COUNT(*) FROM users_urls WHERE user_id = u.id AND is_deleted = false),
  NOW()
FROM users u;

-- Add existing URLs to default deck
INSERT INTO deck_urls (deck_id, user_url_id, added_at)
SELECT 
  d.id,
  uu.id,
  uu.created_at
FROM users_urls uu
JOIN decks d ON d.user_id = uu.user_id AND d.slug = 'general'
WHERE uu.is_deleted = false;

-- Migrate follows: when user A followed user B, 
-- make user A follow all public decks of user B
INSERT INTO deck_follows (deck_id, follower_id, created_at)
SELECT DISTINCT
  d.id,
  f.follower_id,
  f.created_at
FROM follows f
JOIN decks d ON d.user_id = f.following_id AND d.is_public = true;
```

**Deprecation steps:**

- [x] Remove "Follow User" button from UI
- [x] Update `userProfiles.followersCount` to reflect deck followers (deduplicated)
- [x] Add deprecation warning to `follows` table schema
- [x] Remove `followUserRouter` from API
- [x] Delete `apps/web/src/features/follow-user/` directory
- [x] Make `feeds.deckId` NOT NULL (schema change complete)
- [ ] (Future release) Drop `follows` table and its Drizzle relations → See [Phase 10](#phase-10-drop-deprecated-follows-table)

---

## Pricing Plans & Deck Limits

### Overview

Deck limits are enforced based on user's pricing plan. The limits are **not** stored in the `decks` table — they're defined in configuration and checked at creation time against the user's current plan.

### Plan Tiers

| Plan | Public Decks | Private Decks | Total Decks |
|------|--------------|---------------|-------------|
| **Free** | 3 | 1 | 4 |
| **Medium** | 10 | 5 | 15 |
| **Pro** | Unlimited | Unlimited | Unlimited |

### Schema: User Plan Storage

Add to `users` table (or create separate `subscriptions` table):

```typescript
// Option A: Add to users table (simple)
// In packages/db/src/schema.ts, update users table:

export const userPlanEnum = pgEnum("user_plan", ["free", "medium", "pro"]);

export const users = pgTable("users", {
  // ... existing fields ...
  plan: userPlanEnum("plan").default("free").notNull(),
  planUpdatedAt: timestamp("plan_updated_at", { withTimezone: true }),
});
```

```sql
-- Migration
CREATE TYPE user_plan AS ENUM ('free', 'medium', 'pro');
ALTER TABLE users ADD COLUMN plan user_plan DEFAULT 'free' NOT NULL;
ALTER TABLE users ADD COLUMN plan_updated_at TIMESTAMPTZ;
```

### Limits Configuration

Create `packages/deck/src/config/deck-limits.ts`:

```typescript
export const DECK_LIMITS = {
  free: {
    maxPublicDecks: 3,
    maxPrivateDecks: 1,
    maxTotalDecks: 4,
  },
  medium: {
    maxPublicDecks: 10,
    maxPrivateDecks: 5,
    maxTotalDecks: 15,
  },
  pro: {
    maxPublicDecks: Infinity,
    maxPrivateDecks: Infinity,
    maxTotalDecks: Infinity,
  },
} as const;

export type UserPlan = keyof typeof DECK_LIMITS;

export const getDeckLimits = (plan: UserPlan) => DECK_LIMITS[plan];

export const canCreateDeck = (
  plan: UserPlan,
  currentPublicCount: number,
  currentPrivateCount: number,
  isPublic: boolean
): { allowed: boolean; reason?: string } => {
  const limits = getDeckLimits(plan);
  const currentTotal = currentPublicCount + currentPrivateCount;

  if (currentTotal >= limits.maxTotalDecks) {
    return { 
      allowed: false, 
      reason: `You've reached the maximum of ${limits.maxTotalDecks} decks on the ${plan} plan.` 
    };
  }

  if (isPublic && currentPublicCount >= limits.maxPublicDecks) {
    return { 
      allowed: false, 
      reason: `You've reached the maximum of ${limits.maxPublicDecks} public decks on the ${plan} plan.` 
    };
  }

  if (!isPublic && currentPrivateCount >= limits.maxPrivateDecks) {
    return { 
      allowed: false, 
      reason: `You've reached the maximum of ${limits.maxPrivateDecks} private decks on the ${plan} plan.` 
    };
  }

  return { allowed: true };
};
```

### Enforcement in createDeck Procedure

```typescript
// In apps/web/src/features/deck/router/procedures/create-deck.ts

export const createDeck = protectedProcedure
  .input(createDeckSchema)
  .mutation(async ({ input, ctx: { db, userId, logger, requestId } }) => {
    const path = "deck.createDeck";

    // 1. Get user's plan and current deck counts
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: { plan: true },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    const deckCounts = await db
      .select({
        publicCount: sql<number>`COUNT(*) FILTER (WHERE is_public = true)`,
        privateCount: sql<number>`COUNT(*) FILTER (WHERE is_public = false)`,
      })
      .from(schema.decks)
      .where(eq(schema.decks.userId, userId));

    const { publicCount, privateCount } = deckCounts[0] ?? { publicCount: 0, privateCount: 0 };

    // 2. Check limits
    const { allowed, reason } = canCreateDeck(
      user.plan,
      publicCount,
      privateCount,
      input.isPublic
    );

    if (!allowed) {
      logger.warn({ requestId, path, userId, plan: user.plan }, reason);
      throw new TRPCError({
        code: "FORBIDDEN",
        message: reason,
      });
    }

    // 3. Create deck (existing logic)
    // ...
  });
```

### Enforcement When Changing Deck Visibility

When updating a deck from private → public (or vice versa), also check limits:

```typescript
// In updateDeck procedure
if (input.isPublic !== undefined && input.isPublic !== existingDeck.isPublic) {
  // Re-check limits for the new visibility
  const { allowed, reason } = canCreateDeck(
    user.plan,
    input.isPublic ? publicCount : publicCount - 1,  // Adjust for current deck
    input.isPublic ? privateCount - 1 : privateCount,
    input.isPublic
  );

  if (!allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: reason });
  }
}
```

### UI Considerations

1. **Settings page**: Show current usage vs limits
   ```
   Public Decks: 2 / 3
   Private Decks: 1 / 1
   [Upgrade to Medium →]
   ```

2. **Create deck form**: Disable/hide options if at limit
   - If at public limit: Pre-select "Private" or show upgrade prompt
   - If at private limit: Pre-select "Public" or show upgrade prompt
   - If at total limit: Show upgrade prompt instead of form

3. **Upgrade prompts**: When limit is reached, show clear CTA to upgrade

---

## Decisions Made

### Naming
- [x] Feature name: **Deck** (brand alignment with LinkDeck)
- [x] URL pattern: `/@username/slug` (shorter, cleaner)

### Default Behavior (Recommended)
- [x] New users: **No default deck** - users create decks intentionally
- [x] URLs without deck: Show in "All URLs" view (accessible via profile or sidebar)
- [x] Sharing flow: Deck selection **optional** - URLs can exist without deck assignment

### Counts & Stats (Recommended)
- [x] `userProfiles.followersCount`: **Sum of unique deck followers** (deduplicated)
  - If user A follows 3 decks from user B, B's followersCount += 1 (not 3)
  - Requires: Track `user_id` in deck_follows, deduplicate on query or trigger
- [x] Display: Show per-deck follower counts on deck cards, total on profile

### Privacy Model
- [x] Private decks: Cannot be followed, not shown on public profile
- [x] Public decks: Followable, shown on public profile
- [x] URLs can be in both public and private decks simultaneously

---

## Open Questions (Deferred)

### Discovery (Phase 2+)
- [ ] Global deck discovery page? (trending decks, popular decks)
- [ ] Deck search?
- [ ] Recommended decks based on interests?

### Browser Extension (Phase 7)
- [ ] Remember last used deck?
- [ ] Quick deck switching?
- [ ] Create new deck from extension?

### Advanced Features (Future)
- [ ] Collaborative decks (multiple editors)?
- [ ] Deck templates?
- [ ] Import/export decks?

---

## Testing Strategy

### Unit Tests

```
packages/deck/src/schemas/*.test.ts
- Test validation rules (name length, slug format, color format)
- Test edge cases (empty strings, special characters)
```

### Integration Tests (Procedures)

```
apps/web/src/features/deck/router/procedures/*.test.ts
- createDeck: duplicate slug handling, validation
- updateDeck: ownership check, slug conflict
- deleteDeck: cascade behavior (deck_urls, deck_follows deleted)
- addUrlToDeck: ownership, duplicate handling, feed fan-out
- toggleFollowDeck: public/private, self-follow prevention
```

### Key Test Cases

1. **Deck Limits (Unit)**
   - `canCreateDeck()` returns allowed for free user with 0 decks
   - `canCreateDeck()` returns forbidden for free user at public limit (3)
   - `canCreateDeck()` returns forbidden for free user at private limit (1)
   - `canCreateDeck()` returns forbidden for free user at total limit (4)
   - `canCreateDeck()` returns allowed for pro user at any count
   - Limit constants match expected values per plan

2. **Deck CRUD**
   - Create deck with all fields
   - Create deck with minimal fields (name, slug only)
   - Create deck blocked when at limit (free user)
   - Create deck allowed after upgrade (medium/pro user)
   - Update deck slug (verify no conflict)
   - Update deck visibility blocked when at limit
   - Delete deck (verify cascade)

2. **URL Management**
   - Add URL to multiple decks
   - Remove URL from deck (verify URL still exists in users_urls)
   - Add URL to private deck (verify no feed fan-out)
   - Add URL to public deck (verify feed fan-out)

3. **Following**
   - Follow public deck (verify feed populated)
   - Attempt to follow private deck (verify error)
   - Attempt to follow own deck (verify error)
   - Unfollow deck (verify count decremented)

4. **Feed Integration**
   - Filter feed by deck
   - New follower sees existing deck URLs in feed
   - URL added to public deck appears in followers' feeds

5. **Edge Cases**
   - User deletes account (cascade to decks)
   - User deletes URL that's in deck (deck_urls cleanup)
   - Deck made private while has followers (remove all followers - see [When Deck is Made Private](#when-deck-is-made-private))

---

## Edge Cases & Considerations

### When Deck is Made Private

> **Status**: ✅ Complete
> **Decision**: Option B (Remove all followers)
> **Completed**: December 28, 2025

#### Background

When a deck owner changes their deck from public to private, the system must handle existing followers and their feed entries. Two approaches were considered:

| Aspect | Option A: Grandfather | Option B: Remove All |
|--------|----------------------|---------------------|
| Existing followers | Keep, can see future URLs | Remove all |
| New followers | Blocked | Blocked |
| Feed entries | Keep showing | Keep (historical record) |
| Complexity | Higher (special "private but following" state) | Lower (clean break) |
| User expectation | Confusing ("why can some people still see?") | Clear ("private means private") |

**Chosen: Option B** — When a deck becomes private, all followers are removed. This provides a clean, predictable privacy model where "private" means no one else can see the content.

#### Implementation Steps

When `updateDeck` changes `isPublic` from `true` to `false`:

**1. Remove all follow relationships**
```typescript
// In updateDeck procedure, after updating deck visibility
if (existingDeck.isPublic && isPublic === false) {
  // Get all followers before deletion (for profile count updates)
  const followers = await tx.query.deckFollows.findMany({
    where: (follows, { eq }) => eq(follows.deckId, deckId),
    columns: { followerId: true },
  });

  // Delete all deck_follows entries
  await tx.delete(schema.deckFollows)
    .where(orm.eq(schema.deckFollows.deckId, deckId));

  // Reset followers count on deck
  await tx.update(schema.decks)
    .set({ followersCount: 0 })
    .where(orm.eq(schema.decks.id, deckId));
}
```

**2. Update profile followers count (deduplicated)**
```typescript
// For each unique follower, check if they still follow other decks from this owner
for (const { followerId } of followers) {
  const stillFollowingOwner = await tx.query.deckFollows.findFirst({
    where: (follows, { eq }) => eq(follows.followerId, followerId),
    with: { deck: { columns: { userId: true } } },
  });

  const stillFollows = stillFollowingOwner?.deck.userId === existingDeck.userId;

  if (!stillFollows) {
    await tx.update(schema.userProfiles)
      .set({ followersCount: orm.sql`GREATEST(${schema.userProfiles.followersCount} - 1, 0)` })
      .where(orm.eq(schema.userProfiles.userId, existingDeck.userId));
  }
}
```

**3. Feed entries handling**
- **Decision**: Keep existing feed entries as historical record
- Rationale: Consistent with unfollow behavior which also keeps feed entries
- The URLs were legitimately shared when the deck was public
- No cleanup needed for `feeds` table

**4. New follows blocked**
- Already enforced in `toggleFollowDeck` which checks `deck.isPublic`
- No additional changes needed

#### Implementation Location

- `apps/web/src/features/deck/router/procedures/update-deck.ts`
- Add cleanup logic inside transaction after visibility change

#### Test Cases

- [x] Deck with followers made private → all `deck_follows` entries deleted
- [x] Deck with followers made private → `deck.followersCount` reset to 0
- [x] Profile `followersCount` decremented for owner (when follower no longer follows any of their decks)
- [x] Profile `followersCount` NOT decremented (when follower still follows other decks from same owner)
- [x] Feed entries remain after deck made private (historical record)
- [x] Cannot follow deck after it becomes private (already enforced by `toggleFollowDeck`)
- [x] Can follow again after deck is made public again (already supported by `toggleFollowDeck`)

### When URL is Deleted

Currently, URLs cannot be deleted by users. The `users_urls` records are permanent.

If URL deletion is needed in the future, see the [Remove Soft Delete for URLs](#remove-soft-delete-for-urls) section for recommended approaches (hard delete or pending deletion with grace period).

### Slug Conflicts

- Slugs unique per user (`UNIQUE(user_id, slug)`)
- Auto-suggest: "free-games" → "free-games-2" if taken
- Or: Show validation error immediately

### Feed Deduplication

If same URL is in multiple decks user follows, show once in feed.
Already handled by `feeds` table structure (one entry per user-userUrl).

---

## Remove Soft Delete for URLs

> **Status**: ✅ Complete
> **Priority**: High
> **Type**: Schema Cleanup / Simplification
> **Completed**: December 28, 2025

### Summary

Removed the unused soft delete functionality (`isDeleted` column) from the `users_urls` table. The feature was never implemented (no API to set `isDeleted = true`) and added unnecessary query overhead.

### Changes Made

1. **Removed `isDeleted` filters from queries:**
   - `apps/web/src/features/deck/router/procedures/get-deck-urls.ts`
   - `apps/web/src/features/feed/queries/get-user-feed.ts`
   - `apps/web/src/features/feed/router/procedures/toggle-like-url.ts`

2. **Updated schema** (`packages/db/src/schema.ts`):
   - Removed `isDeleted` column from `usersUrls` table
   - Removed partial index on `is_deleted = false`

3. **Created migration** (`0010_remove_soft_delete_for_urls.sql`):
   - Drops the partial index
   - Drops the `is_deleted` column

### Future: If URL Deletion is Needed

If users need to delete URLs in the future, consider:

1. **Hard delete** — Simply delete the `users_urls` record (cascade handles `deck_urls`, `feeds`, etc.)
2. **Pending deletion** — Like decks/users, add `scheduledForDeletionAt` with grace period

---

## Database Query Performance Audit

> **Status**: Pending
> **Priority**: Medium
> **Type**: Performance Optimization

### Overview

Systematically review every tRPC procedure and database query for:

- **Query efficiency** — N+1 problems, missing indexes, unnecessary joins
- **Memory usage** — Large result sets loaded into memory, unbounded queries
- **Pagination correctness** — Cursor-based pagination done properly
- **Index utilization** — Queries using available indexes effectively
- **Redundant queries** — Multiple queries that could be combined

### ⚠️ EXECUTION RULE: ONE AT A TIME

**This audit MUST be executed one procedure at a time.**

When asked to execute this task:
1. Analyze **ONE** procedure/query
2. Propose optimizations
3. Wait for review and approval
4. Implement changes
5. Commit
6. Create migration if schema changes needed
7. **STOP and wait** for instruction to proceed to the next one

**DO NOT** analyze or modify multiple procedures in a single session without explicit approval for each.

### Procedures to Audit

#### Deck Procedures
- [x] `apps/web/src/features/deck/router/procedures/get-deck-urls.ts` ✅ (already optimized)
- [x] `apps/web/src/features/deck/router/procedures/get-deck-by-slug.ts` ✅ (optimized)
- [x] `apps/web/src/features/deck/router/procedures/get-user-decks.ts` ✅ (optimized)
- [ ] `apps/web/src/features/deck/router/procedures/get-public-decks.ts`
- [ ] `apps/web/src/features/deck/router/procedures/add-url-to-deck.ts`
- [ ] `apps/web/src/features/deck/router/procedures/remove-url-from-deck.ts`
- [ ] `apps/web/src/features/deck/router/procedures/create-deck.ts`
- [ ] `apps/web/src/features/deck/router/procedures/update-deck.ts`
- [ ] `apps/web/src/features/deck/router/procedures/toggle-follow-deck.ts`
- [ ] `apps/web/src/features/deck/router/procedures/schedule-deck-deletion.ts`
- [ ] `apps/web/src/features/deck/router/procedures/restore-deck.ts`
- [ ] `apps/web/src/features/deck/router/procedures/get-url-decks.ts`

#### Feed Procedures
- [ ] `apps/web/src/features/feed/queries/get-user-feed.ts`
- [ ] `apps/web/src/features/feed/router/procedures/get-user-feed.ts`
- [ ] `apps/web/src/features/feed/router/procedures/toggle-like-url.ts`

#### Tag Procedures
- [ ] `apps/web/src/features/tag/router/procedures/get-deck-tags.ts`
- [ ] `apps/web/src/features/tag/router/procedures/get-user-tags.ts`
- [ ] `apps/web/src/features/tag/router/procedures/create-tag.ts`
- [ ] `apps/web/src/features/tag/router/procedures/update-tag.ts`
- [ ] `apps/web/src/features/tag/router/procedures/delete-tag.ts`

#### URL Procedures
- [ ] `apps/web/src/features/url/router/procedures/update-user-url.ts`
- [ ] `apps/web/src/features/url/api/v1/add-url/index.ts`

#### User Profile Procedures
- [ ] `apps/web/src/features/user-profile/router/procedures/get-user-profile.ts`
- [ ] `apps/web/src/features/user-profile/router/procedures/create-user-profile.ts`
- [ ] `apps/web/src/features/user-profile/router/procedures/update-user-profile.ts`
- [ ] `apps/web/src/features/user-profile/router/procedures/check-username-availability.ts`

### Checklist Per Procedure

When auditing each procedure, check:

- [ ] Are there sequential queries that could run in parallel (`Promise.all`)?
- [ ] Is there an N+1 query pattern?
- [ ] Are filters applied at SQL level (not in JavaScript)?
- [ ] Is pagination cursor-based and correct?
- [ ] Are appropriate indexes in place for WHERE/ORDER BY clauses?
- [ ] Are JOINs used instead of multiple queries where beneficial?
- [ ] Is `SELECT` limited to needed columns only?
- [ ] Are aggregations done in SQL (e.g., `STRING_AGG`, `COUNT`) vs app layer?

### Progress Tracking

| Date | Procedure | Changes | Migration |
|------|-----------|---------|-----------|
| 2024-12-28 | `get-deck-urls.ts` | 5 optimizations | `0009_add_index_for_cursor_based_pagination.sql` |
| 2025-01-02 | `get-deck-by-slug.ts` | Parallelize userProfile + viewer queries; add column selection to deck query | None |
| 2025-01-02 | `get-user-decks.ts` | Add compound index `(userId, createdAt DESC)` for filter+sort optimization | Pending |

---

## Security Fixes (Priority)

> **Status**: ✅ Complete
> **Identified**: December 18, 2025
> **Completed**: December 18, 2025
> **Severity**: Medium (counter manipulation), Low (TOCTOU)

The following security issues were identified during a code audit and have been addressed.

### Issue #1: Tag Update - Missing `userId` in UPDATE (Low)

**File**: `apps/web/src/features/tag/router/procedures/update-tag.ts`

**Problem**: The UPDATE clause only filters by `id`, not `userId`, creating a TOCTOU vulnerability.

- [x] Fix: Add `userId` filter to UPDATE WHERE clause:
  ```typescript
  .where(orm.and(orm.eq(schema.tags.id, id), orm.eq(schema.tags.userId, userId)))
  ```

### Issue #2: Tag Delete - Missing `userId` in DELETE (Low)

**File**: `apps/web/src/features/tag/router/procedures/delete-tag.ts`

**Problem**: The DELETE clause only filters by `id`, not `userId`.

- [x] Fix: Add `userId` filter to DELETE WHERE clause:
  ```typescript
  await db.delete(schema.tags).where(
    orm.and(orm.eq(schema.tags.id, id), orm.eq(schema.tags.userId, userId))
  );
  ```

### Issue #3: URL Tags Update - Tag Counter Manipulation (Medium)

**File**: `apps/web/src/features/url/router/procedures/update-user-url.ts`

**Problem**: Tag `urlsCount` updates don't verify that the `tagIds` belong to the current user. An attacker could manipulate other users' tag counters.

- [x] Fix: Add `userId` filter to both increment and decrement tag counter updates:
  ```typescript
  .where(orm.and(
    orm.inArray(schema.tags.id, decrement),
    orm.eq(schema.tags.userId, userId)
  ))
  ```

- [x] Alternative: Validate tag ownership before operation:
  ```typescript
  const userTags = await db.query.tags.findMany({
    where: (tags, { and, eq, inArray }) => 
      and(eq(tags.userId, userId), inArray(tags.id, tagIds)),
    columns: { id: true }
  });
  if (userTags.length !== tagIds.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tag IDs" });
  }
  ```

### Issue #4: Add URL - Tag Counter Manipulation (Medium)

**File**: `apps/web/src/features/url/api/v1/add-url/index.ts`

**Problem**: Same as Issue #3 - external API accepts arbitrary `tagIds` and updates counters without ownership verification.

- [x] Fix: Add `userId` filter to tag counter update:
  ```typescript
  .where(orm.and(
    orm.inArray(schema.tags.id, tagIds),
    orm.eq(schema.tags.userId, userId)
  ))
  ```

### Testing Requirements

After fixes, add tests to verify:

- [x] Test: Cannot update tag belonging to another user (covered in `update-tag.test.ts`)
- [x] Test: Cannot delete tag belonging to another user (covered in `delete-tag.test.ts`)
- [ ] Test: Cannot manipulate tag counters via crafted `tagIds` in `updateUserUrl` (**BLOCKED** - see Phase 9 Known Issue)
- [ ] Test: Cannot manipulate tag counters via crafted `tagIds` in `addUrl` API (**BLOCKED** - see Phase 9 Known Issue)

---

## Future: URL Hashes Tables Usage

The `url_hashes` and `url_hashes_compound_hashes_counts` tables are currently populated but not consumed for display/analytics. They are designed for future features:

### Table Purposes

| Table | Tracks | Future Use Cases |
|-------|--------|------------------|
| `url_hashes` | How many times each exact URL+metadata combo was shared (`count`) | Share count display, trending URLs, popularity ranking |
| `url_hashes_compound_hashes_counts` | How many different metadata versions exist per URL (`compoundHashesCount`) | Detecting stale/conflicting metadata, prompting merge/update |

### Planned Features

- [ ] Show "shared X times" on URL cards
- [ ] Trending URLs feature based on share counts
- [ ] Alert when `compoundHashesCount > 1` (same URL, different metadata - possible stale data)
- [ ] Admin/user tool to merge duplicate URL entries with conflicting metadata

### Useful Query for Conflict Detection

```sql
-- Find all metadata versions for a URL with conflicts
SELECT uh.compound_hash, u.metadata 
FROM url_hashes uh
JOIN urls u ON uh.compound_hash = u.compound_hash
WHERE uh.url_hash = ?
  AND (SELECT compound_hashes_count 
       FROM url_hashes_compound_hashes_counts 
       WHERE url_hash = uh.url_hash) > 1;
```

The existing index on `url_hashes.url_hash` ensures this query is efficient.

---

## Phase 9: Integration Tests Infrastructure for tRPC Procedures

> **Status**: ✅ Complete
> **Priority**: Medium
> **Dependencies**: None (can be done independently)
> **Completed**: December 27, 2025

### Overview

Implement integration tests for tRPC procedures using a real test database instead of mocking database queries. This aligns with the CODING-GUIDELINE.md which states:
- "Database queries: Use test database with real data" (don't mock them)
- "Business logic: Test the actual implementation"

### Approach

Use `createCallerFactory` from tRPC to call procedures directly with a test context that includes:
- **Real test database** (not mocks) - insert actual test data, verify actual DB state
- **Mocked auth** (`ctx.auth`) - simulate authenticated/unauthenticated users
- **Mocked logger** (`ctx.logger`) - verify logging calls
- **Real request ID** generation

### Files Created

Test utilities:
- [x] `apps/web/src/test-utils/create-test-context.ts` - Factory for creating test tRPC context
- [x] `apps/web/src/test-utils/test-db.ts` - Test database setup/teardown helpers
- [x] `apps/web/src/test-utils/index.ts` - Barrel exports
- [x] `apps/web/src/test-utils/server-only-mock.ts` - Mock for server-only package

Configuration:
- [x] `apps/web/vitest.config.ts` - Updated with path aliases and server-only mock
- [x] `apps/web/package.json` - Added `test` and `test:watch` scripts, `@repo/tests-setup` dependency

Procedure tests (tag procedures as reference implementation):
- [x] `apps/web/src/features/tag/router/procedures/delete-tag.test.ts` (5 tests)
- [x] `apps/web/src/features/tag/router/procedures/update-tag.test.ts` (10 tests)
- [x] `apps/web/src/features/tag/router/procedures/create-tag.test.ts` (7 tests)
- [x] `apps/web/src/features/tag/router/procedures/get-user-tags.test.ts` (7 tests)

### Test Structure Example

```typescript
// delete-tag.test.ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { deleteTag } from "./delete-tag";
import { createTestContext, cleanupTestData } from "@/test-utils";
import { schema } from "@repo/db/db";

const testRouter = createTRPCRouter({ deleteTag });
const createCaller = createCallerFactory(testRouter);

describe("deleteTag procedure", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await cleanupTestData(ctx.db);
  });

  it("should delete a tag that exists and belongs to the user", async () => {
    const [tag] = await ctx.db.insert(schema.tags).values({
      userId: ctx.userId,
      name: "Test Tag",
    }).returning();
    const caller = createCaller(ctx);

    await caller.deleteTag({ id: tag.id });

    const result = await ctx.db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, tag.id),
    });
    expect(result).toBeNull();
  });

  it("should throw BAD_REQUEST when tag doesn't exist", async () => {
    const caller = createCaller(ctx);

    await expect(caller.deleteTag({ id: "tag_nonexistent123" }))
      .rejects.toThrow(TRPCError);
  });

  it("should not delete a tag belonging to another user", async () => {
    const [otherUserTag] = await ctx.db.insert(schema.tags).values({
      userId: "user_other_user_id",
      name: "Other User Tag",
    }).returning();
    const caller = createCaller(ctx);

    await expect(caller.deleteTag({ id: otherUserTag.id }))
      .rejects.toThrow(TRPCError);
  });
});
```

### Test Database Strategy

**Chosen approach**: Use real database with environment variables loaded from `.env.local`. Each test creates its own test user and cleans up after itself using the `cleanup()` function.

Key configuration:
- `vitest.config.ts` loads `.env.local` for `DATABASE_URL`
- `server-only` package is mocked to allow tests to run outside Next.js context
- Path alias `@/` is configured to resolve to `./src`

### Verification

After implementation:
- [x] All tag procedure tests pass (29 tests)
- [x] Security fix tests from Issue #1-#2 are covered (delete/update tag belonging to another user)
- [x] Pattern documented for other procedure tests (see test files for examples)
- [ ] CI pipeline runs integration tests (requires CI configuration)

### Known Issue: Multi-Table Procedure Tests Fail

> **Status**: Unresolved
> **Discovered**: December 27, 2025
> **Affects**: Testing procedures that involve multiple tables (e.g., `updateUserUrl`)

#### Problem Description

The test infrastructure works for simple single-table procedures (tag CRUD) but fails for procedures that operate on multiple tables.

#### Observed Behavior

**Working test pattern (single table - tags):**
```typescript
it("should delete a tag", async () => {
  const tag = await createTestTag(ctx.db, ctx.userId, "Test Tag");
  const caller = createCaller(ctx.trpcContext);
  
  await caller.deleteTag({ id: tag.id });
  
  const result = await ctx.db.query.tags.findFirst({...});
  expect(result).toBeUndefined(); // ✓ PASSES - tag was deleted
});
```

**Failing test pattern (multi-table - userUrl + tags):**
```typescript
it("should add a tag to a userUrl", async () => {
  const userUrl = await createTestUserUrl(ctx.db, ctx.userId);
  const tag = await createTestTag(ctx.db, ctx.userId, "Test Tag");
  const caller = createCaller(ctx.trpcContext);
  
  await caller.updateUserUrl({ userUrlId: userUrl.id, tagIds: [tag.id] });
  
  // Query immediately after - WITHIN THE SAME TEST
  const association = await ctx.db.query.userUrlsTags.findFirst({...});
  expect(association).toBeDefined(); // ✗ FAILS - returns undefined
});
```

The procedure returns `{ success: true }`, but the data it inserted into `userUrlsTags` is not visible when querying with `ctx.db` immediately after.

#### Suspected Root Cause

The test context setup and tRPC middleware may be using different user contexts:

1. **Test setup** (`createTestContext`):
   - Creates user with `clerkUserId` via `createTestUser(db, clerkUserId)`
   - Stores internal `user.id` as `ctx.userId`
   - Creates mock auth with `auth.userId = clerkUserId`

2. **Procedure execution** (via `isAuthenticated` middleware in `trpc.ts`):
   - Gets `clerkUserId` from `ctx.auth.userId`
   - Upserts user: `INSERT INTO users ... ON CONFLICT DO UPDATE ... RETURNING`
   - Uses `ctx.db._.fullSchema.users` (not `schema.users`)

**Hypothesis**: The middleware's upsert via `ctx.db._.fullSchema.users` may return a different user object/ID than the one created by `createTestUser`, causing the procedure to operate on a different user's context than expected.

#### What Needs Investigation

1. Verify that `ctx.db._.fullSchema.users` and `schema.users` reference the same table definition
2. Add logging to the middleware to confirm which `userId` it resolves
3. Compare the `userId` from middleware vs `ctx.userId` from test setup
4. Check if there's a transaction isolation issue between procedure and test queries

#### Temporary Workaround

The security tests for Issues #3-#4 (tag counter manipulation in `updateUserUrl` and `addUrl`) remain uncovered. The security fixes are implemented in the code but lack test verification.

#### Files Involved

- `apps/web/src/test-utils/create-test-context.ts` - Test context factory
- `apps/web/src/server/api/trpc.ts` - `isAuthenticated` middleware (lines 122-149)
- `apps/web/src/features/url/router/procedures/update-user-url.ts` - Procedure under test

---

## Feed Query Cleanup: Remove Tag Filtering

> **Status**: ✅ Complete
> **Priority**: High
> **Identified**: December 27, 2025
> **Completed**: December 27, 2025

### Overview

The feed query (`getUserFeedQuery`) currently supports tag filtering, but this functionality should be disabled for feeds. Tag filtering should only be available when viewing a specific deck, not when browsing the general feed.

**Rationale**: Tags are per deck-URL, making it impossible to filter the feed effectively by tags since:
- The same URL can have different tags in different decks
- A feed entry from a followed deck may have tags that don't match the user's own deck tags
- Tag filtering in feeds creates confusion about which context the tags apply to

### Current Implementation (To Be Removed)

The tag filtering is implemented at multiple levels:

#### 1. Query Level (`apps/web/src/features/feed/queries/get-user-feed.ts`)

```typescript
// Lines 21-42: Tag filter subquery (to be removed)
const createTagFilterSubquery = (tagIds: Tag["id"][], deckId?: Deck["id"]) => { ... };

// Line 12: tagIds in options type
tagIds: Tag["id"][];

// Lines 70, 135-137: Tag filtering logic
const includeTags = tagIds.length > 0;
const baseTagCondition = includeTags ? orm.sql`...` : undefined;
```

Also removes unnecessary LEFT JOINs to `deckUrlsTags` and `tags` tables (lines 105-112) unless tag names still need to be displayed.

#### 2. Procedure Level (`apps/web/src/features/feed/router/procedures/get-user-feed.ts`)

```typescript
// Line 19: tagIds in schema
tagIds: z.array(tagIdSchema).optional().default([]),

// Line 48: tagIds passed to query
tagIds: input.tagIds,
```

#### 3. UI Level (`apps/web/src/features/feed/ui/user-feed-list/infinite-user-feed.tsx`)

```typescript
// Lines 40-41: Tag parsing from URL
const tagsString = qs.parse(searchParams.toString()).tags;
const tagIdsInSearchParams = typeof tagsString === "string" ? tagsString.split(",") : [];

// Line 50: tagIds passed to query
tagIds: tagIdsInSearchParams,
```

### Implementation Steps

- [x] **Query cleanup** (`get-user-feed.ts`):
  - Remove `createTagFilterSubquery` function entirely
  - Remove `tagIds` from `GetUserFeedQueryOptions` type
  - Remove `includeTags` variable and `baseTagCondition`
  - Keep LEFT JOINs to `deckUrlsTags`/`tags` for displaying tag names in feed items

- [x] **Procedure cleanup** (`procedures/get-user-feed.ts`):
  - Remove `tagIds` from `querySchema`
  - Remove `tagIds` from `getUserFeedQuery` call

- [x] **UI cleanup** (`infinite-user-feed.tsx`):
  - Remove `tagsString` and `tagIdsInSearchParams` parsing
  - Remove `tagIds` from query input
  - Remove `qs` import (no longer needed)

- [x] **Filter UI cleanup**:
  - Remove `TagsSelector` from `feed-list-filters.tsx`
  - Remove `tags` prop from `FeedListFiltersProps`
  - Update `logged-in-user-content.tsx` to not pass `tags` prop to `FeedListFilters`
  - Keep tag filtering only in deck-specific views

### Performance Impact

Removing tag filtering will:
- Eliminate the complex IN subquery with GROUP BY/HAVING
- Reduce JOIN operations (potentially remove 2 LEFT JOINs if tag names aren't displayed)
- Simplify the overall query execution plan
- Reduce memory usage from the GROUP BY aggregation

### Notes

- **Deck views have tag filtering**: The `/@username/deck-slug` page supports filtering by tags. This was implemented because:
  - Tags are scoped to a deck (each deck has its own tag set)
  - The user is viewing content from a single context where tag filtering is meaningful
  - The tag filter UI shows only tags used in that specific deck
- The `tag_names` aggregation with STRING_AGG is still used in feed items for display purposes
- Tag names are also shown on deck URL cards

### Deck Tag Filtering Implementation

> **Status**: ✅ Complete
> **Completed**: December 28, 2025

#### Files Created/Modified

1. **`apps/web/src/features/deck/router/procedures/get-deck-urls.ts`**:
   - Added `tagIds` parameter to input schema
   - Implemented tag filtering using `deckUrlsTags` table with GROUP BY/HAVING for "all tags must match"
   - Added `tagNames` to response items for display

2. **`apps/web/src/features/deck/ui/public-deck/deck-url-list.tsx`**:
   - Added `tagIds` prop for filtering
   - Updated empty state message for tag filter scenario
   - Display tag badges on URL cards

3. **`apps/web/src/features/deck/ui/public-deck/deck-content.tsx`** (new):
   - Client component wrapping `DeckUrlList` with tag filter UI
   - Fetches deck tags via `api.tags.getDeckTags`
   - Manages selected tag state and passes to `DeckUrlList`

4. **`apps/web/src/app/[username]/[slug]/page.tsx`**:
   - Replaced `DeckUrlList` with `DeckContent` for tag filtering support

---

## User Account Deletion Strategy

> **Status**: Planning
> **Priority**: Medium
> **Dependencies**: Background job infrastructure

### Overview

User account deletion should follow the **pending deletion pattern** (similar to decks, but with a longer grace period). This aligns with GDPR requirements and provides a safety net for accidental deletions.

### Why Pending Deletion for Users

| Factor | User Deletion | Deck Deletion |
|--------|---------------|---------------|
| Stakes | Very high (entire account) | Medium (one collection) |
| Recovery importance | Critical | Nice to have |
| Regulatory | GDPR requires grace period | None |
| Common UX pattern | Gmail, Google, Facebook all use it | Less common |
| Deletion complexity | 10+ tables across 3 levels | 3 tables |

### Schema Change

Add to `users` table:

```typescript
scheduledForDeletionAt: timestamp("scheduled_for_deletion_at", { withTimezone: true }),
```

### User Flow

```
User clicks "Delete Account" → Confirmation required (password/2FA)
        ↓
users.scheduledForDeletionAt = now() + 30 days
        ↓
Email sent: "Your account will be deleted on [date]"
        ↓
User can log in and click "Cancel Deletion" within 30 days
        ↓
Background job (daily) finds users WHERE scheduledForDeletionAt < now()
        ↓
Hard deletes in dependency order + notifies Clerk
```

### Behavior During Grace Period

| Feature | Behavior |
|---------|----------|
| Login | Allowed (to cancel deletion) |
| View data | Allowed |
| Add new URLs | Blocked |
| Create decks | Blocked |
| Public profile | Hidden from search/discovery |
| Followers see posts | No (filter by `scheduledForDeletionAt`) |
| API access | Blocked |

### Deletion Dependency Order

Based on schema dependency graph, deletion must happen in this order:

```
Step 1: Level 2 dependencies (leaf nodes)
├── usersUrlsInteractions (user's + on user's URLs)
├── feeds (user's feed + entries for user's URLs)
├── userUrlsTags (tags on user's URLs)
├── deckUrls (URLs in user's decks)
└── deckFollows (followers of user's decks + user's follows)

Step 2: Level 1 dependencies (branches)
├── usersUrls (user's URLs)
├── tags (user's tags)
├── follows (user following + followers)
├── decks (user's decks)
└── userProfiles (user's profile)

Step 3: Level 0 (root)
└── users (the user record)

Step 4: External systems
└── Clerk user deletion
```

### API Procedures

#### `scheduleAccountDeletion`

```typescript
export const scheduleAccountDeletion = protectedProcedure
  .mutation(async ({ ctx: { userId, db } }) => {
    const scheduledForDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await db
      .update(schema.users)
      .set({ scheduledForDeletionAt })
      .where(orm.eq(schema.users.id, userId));
    
    // TODO: Send confirmation email
    // TODO: Notify Clerk to restrict user capabilities
    
    return { scheduledForDeletionAt };
  });
```

#### `cancelAccountDeletion`

```typescript
export const cancelAccountDeletion = protectedProcedure
  .mutation(async ({ ctx: { userId, db } }) => {
    await db
      .update(schema.users)
      .set({ scheduledForDeletionAt: null })
      .where(orm.and(
        orm.eq(schema.users.id, userId),
        orm.isNotNull(schema.users.scheduledForDeletionAt)
      ));
    
    return { cancelled: true };
  });
```

### Background Job

Run daily to process scheduled deletions:

```typescript
async function processScheduledUserDeletions() {
  const usersToDelete = await db.query.users.findMany({
    where: (users, { and, isNotNull, lt }) =>
      and(
        isNotNull(users.scheduledForDeletionAt),
        lt(users.scheduledForDeletionAt, new Date())
      ),
    columns: { id: true, clerkUserId: true },
  });

  for (const user of usersToDelete) {
    await db.transaction(async (tx) => {
      const userId = user.id;
      
      // Level 2 - Leaf tables
      // ... (delete in dependency order)
      
      // Level 1 - Branch tables
      // ... (delete in dependency order)
      
      // Level 0 - Root
      await tx.delete(schema.users).where(orm.eq(schema.users.id, userId));
    });
    
    // External: Delete from Clerk
    await clerkClient.users.deleteUser(user.clerkUserId);
  }
}
```

### Query Updates Required

Queries that need to filter out pending-deletion users:

- [ ] `get-user-feed.ts` - Hide URLs from users pending deletion
- [ ] `get-public-decks.ts` - Hide decks from users pending deletion
- [ ] `get-deck-by-slug.ts` - Return null for pending-deletion users
- [ ] User search/discovery features (future)

### Comparison: Deck vs User Deletion

| Aspect | Deck | User |
|--------|------|------|
| Grace period | 30 minutes | 30 days |
| Schema change | 1 column on `decks` | 1 column on `users` |
| Background job frequency | Every 5 min | Daily |
| Background job complexity | 4 deletes | 10+ deletes with subqueries |
| External systems | None | Clerk user deletion |
| Email notifications | Optional | Required |

### Implementation Phases

1. **Schema**: Add `scheduledForDeletionAt` to users table
2. **API**: Create `scheduleAccountDeletion` and `cancelAccountDeletion` procedures
3. **UI**: Settings page with "Delete Account" flow and cancel option
4. **Background Job**: Implement daily cleanup job
5. **Queries**: Update all relevant queries to filter pending-deletion users
6. **Notifications**: Email confirmation and reminder system

### Open Questions

- [ ] What background job infrastructure to use? (Cron, queue, Supabase Edge Functions?)
- [ ] Send reminder email before final deletion? (e.g., 7 days before, 1 day before)
- [ ] Should pending-deletion users count toward follower counts?
- [ ] Export data option before deletion? (GDPR requirement)

---

## Phase 10: Drop Deprecated `follows` Table

> **Status**: Planning
> **Priority**: Low
> **Dependencies**: Deck-follows must be stable in production

### Overview

The `follows` table has been deprecated and replaced by `deck_follows`. Users now follow decks instead of other users. This cleanup phase removes the deprecated table and related code.

### Prerequisites

Before proceeding, verify:
- [ ] Deck-follows has been running in production without issues for at least 2 weeks
- [ ] No code references the `follows` table (search for `follows` and `Follow` type usage)
- [ ] Historical follow data has been migrated or is no longer needed

### Implementation Steps

#### 1. Search for References

```bash
# Find any remaining references
grep -r "follows" --include="*.ts" --include="*.tsx" apps/ packages/
grep -r "Follow" --include="*.ts" --include="*.tsx" apps/ packages/
```

Exclude false positives:
- `deckFollows` / `DeckFollow` - these are the new tables
- `deck_follows` - new table name
- Comments/docs mentioning deprecated status

#### 2. Remove Drizzle Schema

Update `packages/db/src/schema.ts`:

- [ ] Remove `follows` table definition
- [ ] Remove `Follow` type export
- [ ] Remove `followsRelations` if it exists
- [ ] Update dependency graph comment at top of file
- [ ] Remove `follows` from `usersRelations` if referenced

#### 3. Remove Type Export

Update `packages/db/src/types.ts`:

- [ ] Remove `Follow` from exports

#### 4. Create Database Migration

Create `packages/db/supabase/migrations/XXXX_drop_follows_table.sql`:

```sql
-- Drop the deprecated follows table
-- This table has been replaced by deck_follows

-- Drop indexes first
DROP INDEX IF EXISTS idx_follows_follower_id;
DROP INDEX IF EXISTS idx_follows_following_id;

-- Drop the table
DROP TABLE IF EXISTS follows;
```

#### 5. Run Migration

```bash
cd packages/db
pnpm db:generate
pnpm db:migrate
```

#### 6. Verification

```bash
# Verify no TypeScript errors
pnpm typecheck

# Verify all tests pass
pnpm test

# Verify table is gone (in Drizzle Studio or DB client)
pnpm db:studio
```

### Rollback Plan

If issues are discovered after migration:

1. The migration is one-way (DROP TABLE) - no automatic rollback
2. If needed, restore from backup or recreate table from schema history
3. Consider keeping a backup of follows data before dropping

### Notes

- The `follows` table data was migrated to `deck_follows` in Phase 8
- All UI and API code has been updated to use deck-follows
- This is a cleanup step with no user-facing impact

---

## Refactor: Rename `usernameNormalized` to `slug` in User Profiles

> **Status**: Planning
> **Priority**: Low
> **Dependencies**: None

### Overview

The `user_profiles.usernameNormalized` column is currently named after **how** it was created (a normalized version of the username), rather than **what** it's used for (a URL-safe identifier). Since its primary purpose is to serve as the URL segment for user profile pages (e.g., `/{slug}`), it should be renamed to `slug` for consistency with the deck pattern.

### Rationale

| Current | Proposed |
|---------|----------|
| `usernameNormalized` describes **how** it was created | `slug` describes **what** it's used for |

Benefits:
- **Consistency** with `decks.slug` pattern (both are URL identifiers)
- **Clarity of intent** — it's a URL segment, not just a normalized copy
- **Web conventions** — "slug" is the standard term for URL-safe identifiers

The `user_profiles` table would then have:
- `username` — display name (preserves casing: "JohnDoe")
- `slug` — URL identifier (lowercase: "johndoe")

This mirrors the deck pattern of `name` + `slug`.

### Migration Steps

#### 1. Database Migration

Create migration file `packages/db/supabase/migrations/XXXX_rename_username_normalized_to_slug.sql`:

```sql
-- Rename column
ALTER TABLE user_profiles RENAME COLUMN username_normalized TO slug;

-- Rename constraint (if exists)
ALTER TABLE user_profiles RENAME CONSTRAINT user_profiles_username_normalized_unique TO user_profiles_slug_unique;
```

#### 2. Schema Update

Update `packages/db/src/schema.ts`:

```typescript
export const userProfiles = pgTable("user_profiles", {
  // ... other fields ...
  username: varchar("username").unique().notNull(),
  slug: varchar("slug").unique().notNull(),  // renamed from usernameNormalized
  // ...
});
```

#### 3. File Renames

| Current Path | New Path |
|--------------|----------|
| `packages/user-profile/src/utils/normalize-username.ts` | `packages/user-profile/src/utils/generate-slug.ts` (or keep as-is if still called "normalize") |
| `packages/user-profile/src/utils/normalize-username.test.ts` | `packages/user-profile/src/utils/generate-slug.test.ts` |

**Alternative**: Keep the file names as-is since "normalize username" accurately describes the transformation. The function `normalizeUsername()` still makes sense — it takes a username and normalizes it to produce a slug.

#### 4. Code Updates

Files that reference `usernameNormalized`:

| File | Change Required |
|------|-----------------|
| `packages/db/src/schema.ts` | Rename field to `slug` |
| `apps/web/src/features/deck/router/procedures/get-deck-by-slug.ts` | Change `.usernameNormalized` to `.slug` |
| `apps/web/src/features/deck/router/procedures/get-public-decks.ts` | Change `.usernameNormalized` to `.slug` |
| `apps/web/src/features/user-profile/router/procedures/username-check.ts` | Change `.usernameNormalized` to `.slug` |
| `apps/web/src/features/user-profile/router/procedures/get-public-user-profile.ts` | Change `.usernameNormalized` to `.slug` |
| `apps/web/src/features/user-profile/router/procedures/create-user-profile.ts` | Change `.usernameNormalized` to `.slug` |
| `apps/web/src/features/user-profile/dto/public-user-profile.dto.ts` | Change field name if exposed |
| `apps/web/src/app/[username]/page.tsx` | Change `.usernameNormalized` to `.slug` |

#### 5. Update Migration Snapshots

Run `pnpm db:generate` to update Drizzle snapshots after schema change.

#### 6. Verification

```bash
# Run all tests to ensure nothing breaks
pnpm test

# Verify TypeScript compiles
pnpm typecheck

# Run linter
pnpm lint
```

### Notes

- The `normalizeUsername()` function can keep its name — it accurately describes the transformation (username → slug)
- Alternatively, rename to `generateSlug()` or `usernameToSlug()` for clarity
- No breaking changes to public APIs if the DTO already uses a different field name

---

## Refactor: Standardize `name` / `display_name` Column Convention

> **Status**: Planning
> **Priority**: Low
> **Dependencies**: None

### Overview

The DB schema has inconsistent patterns for storing normalized values vs display values across tables. This refactor aims to standardize on a `name` + `display_name` convention for consistency.

### Current Patterns

| Table | Normalized Column | Display Column | Pattern Used |
|-------|-------------------|----------------|--------------|
| `tags` | `name` | `displayName` | ✅ `name` / `display_name` |
| `decks` | `slug` | `name` | URL slug (different use case) |
| `userProfiles` | `usernameNormalized` | `username` | ❌ Inconsistent |

### Recommended Convention

For tables that need both a normalized value (for search/uniqueness) and a display value (preserving casing):

- **`name`**: Normalized value (lowercase, trimmed) — used for lookups, uniqueness constraints, global search
- **`display_name`**: Original value with preserved casing — used for UI display

### Tables to Review

1. **`userProfiles`** (already planned in [Refactor: Rename usernameNormalized to slug](#refactor-rename-usernamenormalized-to-slug-in-user-profiles))
   - Currently: `username` (display) + `usernameNormalized` (normalized)
   - Decision: Since this is used as a URL identifier, use `slug` pattern instead of `name`/`display_name`

2. **`tags`** — Already follows the convention ✅
   - `name` (normalized) + `displayName` (display)

3. **`decks`** — Uses `name` + `slug` pattern
   - `name` is the display value, `slug` is the URL-safe identifier
   - This is correct for URL routing purposes, no change needed

### Notes

- The `name`/`display_name` pattern is for **searchable/comparable values**
- The `name`/`slug` pattern (as in `decks`) is for **URL identifiers**
- Don't confuse these patterns — they serve different purposes
- When adding new tables with normalized + display columns, prefer `name`/`display_name`

---

## Cleanup: Remove Unnecessary Defensive Checks After Drizzle Inserts

> **Status**: Planning
> **Priority**: Low
> **Dependencies**: None

### Overview

The codebase has inconsistent defensive checks after Drizzle `.returning()` calls. These checks are unnecessary because Drizzle throws an exception on insert failures rather than returning an empty array.

### Current Pattern (Unnecessary)

```typescript
const [url] = await tx
  .insert(schema.urls)
  .values({ ... })
  .returning();

if (!url) {
  throw new Error("Failed to create URL entry.");
}
```

### Why Remove

1. **Unreachable code** — Drizzle throws exceptions on insert failures, so these checks never execute
2. **Trust the ORM** — Drizzle's error handling provides detailed database error messages
3. **Less noise** — Cleaner code without impossible branches
4. **Type safety** — TypeScript with Drizzle guarantees the return type when `.returning()` succeeds

### Files to Update

| File | Location | Check to Remove |
|------|----------|-----------------|
| `apps/web/src/features/url/api/v1/add-url/index.ts` | Line ~74 | `if (!url)` |
| `apps/web/src/features/url/api/v1/add-url/index.ts` | Line ~103 | `if (!userUrl)` |
| `apps/web/src/test-utils/test-db.ts` | `createTestUser` | `if (!user)` |
| `apps/web/src/test-utils/test-db.ts` | `createTestDeck` | `if (!deck)` |
| `apps/web/src/test-utils/test-db.ts` | `createTestTag` | `if (!tag)` |
| `apps/web/src/server/api/trpc.ts` | User upsert | `if (!user)` |

### Exception

If using `.onConflictDoNothing()` with `.returning()`, defensive checks ARE necessary since conflicts return empty arrays. Currently no code uses this pattern.

---

## Utility: International Display Name Normalization

> **Status**: Planning
> **Priority**: Medium
> **Dependencies**: None (foundational utility)

### Overview

The current normalization for display names (tags, etc.) uses simple `.toLowerCase().trim()` which has significant limitations with international text and Unicode.

### Current Implementation

```typescript
// In create-tag.ts, update-tag.ts, route.ts
const name = displayName.toLowerCase().trim();
```

**Current `tagNameSchema`** (`packages/tag/src/name/tag-name.schema.ts`):

```typescript
export const TAG_NAME_MAX_LENGTH = 30;

export const tagNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(TAG_NAME_MAX_LENGTH)  // Uses JS string.length (UTF-16 code units)
  .refine((val) => !val.includes(","), {
    message: `Tag name can't include comma "," character.`,
  });
```

### Problems with Current Approach

| Problem | Example | Impact |
|---------|---------|--------|
| Case folding incomplete | German "ß" → should be "ss", Turkish "İ" → "i" (dot issue) | Duplicate tags possible |
| Unicode equivalence not handled | "é" (U+00E9) vs "é" (e + combining acute) treated as different | Same visual tag creates duplicates |
| No script validation | Emoji, symbols, control chars all allowed | Security risks, search issues |
| Length mismatch JS vs PostgreSQL | "👨‍👩‍👧‍👦".length = 11 in JS, but 7 codepoints in PG | Validation bypasses possible |

### Storage Schema Analysis

```typescript
// packages/db/src/schema.ts
name: varchar("name", { length: 50 }).notNull(),        // normalized
displayName: varchar("display_name", { length: 50 }).notNull(), // original
```

**PostgreSQL `VARCHAR(n)`** counts by characters (codepoints), not bytes. However:

| Issue | Example | Count |
|-------|---------|-------|
| Basic emoji | "🔥" | 1 codepoint, 2 JS length |
| ZWJ sequence | "👨‍👩‍👧‍👦" | 7 codepoints, 11 JS length |
| Combining marks | "é" (e + ́) | 2 codepoints, 2 JS length |

### Recommendation: Disallow Emoji

For tags (categorization labels), emoji add complexity without significant value:

| Approach | Pros | Cons |
|----------|------|------|
| **Disallow emoji** | Simple length validation, consistent search, predictable sorting | Less "expressive" |
| **Allow emoji** | More expressive | Grapheme counting required, search issues, sorting problems |

**Decision**: Disallow emoji and non-letter/number symbols. Tags are for organization, not decoration.

### Proposed Solution

Create a two-function pattern in `packages/shared/`:

#### 1. `normalizeDisplayName()` — Safe normalization

```typescript
/**
 * Normalizes a display name for storage and uniqueness checks.
 * 
 * Steps:
 * 1. Trim whitespace
 * 2. Unicode NFC normalization (canonical composition)
 * 3. Case fold using proper Unicode rules
 * 
 * @example
 * normalizeDisplayName("  Café  ") // "café"
 * normalizeDisplayName("STRAßE")   // "strasse"
 * normalizeDisplayName("ПРИВЕТ")   // "привет"
 */
export function normalizeDisplayName(displayName: string): string {
  return displayName
    .trim()
    .normalize("NFC")           // Canonical composition
    .toLocaleLowerCase('und');  // Unicode-aware case folding
}
```

#### 2. `validateDisplayName()` — Security and format checks

```typescript
/**
 * Validates that a display name is safe and well-formed.
 * 
 * Checks:
 * - Not empty after trim
 * - No emoji or extended pictographics
 * - No control characters
 * - No zero-width characters (homoglyph attack prevention)
 * - Only letters, numbers, spaces, and limited punctuation
 * - Within length limits
 */
export function validateDisplayName(
  displayName: string, 
  options: { maxLength: number; minLength?: number }
): { valid: true } | { valid: false; reason: string };
```

### Validation Rules

#### Allowed Characters

```typescript
// Unicode categories to ALLOW:
// \p{L}  - Letters (any script: Latin, Cyrillic, Greek, CJK, Arabic, etc.)
// \p{N}  - Numbers
// \p{Zs} - Space separators
// Limited punctuation: - _ . (configurable)

const ALLOWED_PATTERN = /^[\p{L}\p{N}\p{Zs}\-_.]+$/u;
```

#### Blocked Characters

```typescript
// Patterns to REJECT:
const BLOCKED_PATTERNS = [
  /\p{Extended_Pictographic}/u,  // Emoji
  /[\u200B-\u200F]/,             // Zero-width chars
  /[\u2028\u2029]/,              // Line/paragraph separators
  /\p{Cc}/u,                     // Control characters
  /\p{Co}/u,                     // Private use
];
```

### Test Cases

```typescript
describe("normalizeDisplayName", () => {
  // Basic normalization
  it("trims whitespace", () => expect(normalize("  hello  ")).toBe("hello"));
  it("lowercases ASCII", () => expect(normalize("HELLO")).toBe("hello"));
  
  // Unicode normalization (NFC)
  it("normalizes equivalent Unicode forms", () => {
    const composed = "café";     // é as single codepoint
    const decomposed = "café";   // e + combining acute
    expect(normalize(composed)).toBe(normalize(decomposed));
  });
  
  // International scripts
  it("handles Cyrillic", () => expect(normalize("ПРИВЕТ")).toBe("привет"));
  it("handles Greek", () => expect(normalize("ΑΛΦΑ")).toBe("αλφα"));
  it("handles German eszett", () => {
    // Note: toLocaleLowerCase('und') may or may not expand ß to ss
    // This test documents actual behavior
    expect(normalize("STRAßE")).toBe("straße"); // or "strasse"
  });
  it("preserves CJK (no case)", () => expect(normalize("日本語")).toBe("日本語"));
  it("handles Arabic", () => expect(normalize("مرحبا")).toBe("مرحبا"));
  it("handles mixed scripts", () => {
    expect(normalize("Hello世界Мир")).toBe("hello世界мир");
  });
});

describe("validateDisplayName", () => {
  const validate = (s: string) => validateDisplayName(s, { maxLength: 30 });
  
  // Valid inputs
  it("accepts ASCII letters", () => expect(validate("gaming").valid).toBe(true));
  it("accepts Cyrillic", () => expect(validate("игры").valid).toBe(true));
  it("accepts CJK", () => expect(validate("日本語").valid).toBe(true));
  it("accepts numbers", () => expect(validate("top10").valid).toBe(true));
  it("accepts spaces", () => expect(validate("free games").valid).toBe(true));
  it("accepts hyphens", () => expect(validate("role-playing").valid).toBe(true));
  
  // Invalid inputs
  it("rejects emoji", () => expect(validate("gaming🔥").valid).toBe(false));
  it("rejects zero-width chars", () => expect(validate("hel\u200Blo").valid).toBe(false));
  it("rejects control chars", () => expect(validate("hello\x00").valid).toBe(false));
  it("rejects empty after trim", () => expect(validate("   ").valid).toBe(false));
  it("rejects too long", () => expect(validate("a".repeat(31)).valid).toBe(false));
});
```

### Files to Create

| File | Description |
|------|-------------|
| `packages/shared/src/utils/display-name/normalize-display-name.ts` | Core normalization function |
| `packages/shared/src/utils/display-name/normalize-display-name.test.ts` | Normalization tests |
| `packages/shared/src/utils/display-name/validate-display-name.ts` | Validation function with security checks |
| `packages/shared/src/utils/display-name/validate-display-name.test.ts` | Validation tests |
| `packages/shared/src/utils/display-name/index.ts` | Barrel exports |
| `packages/shared/src/utils/display-name/constants.ts` | Shared patterns and limits |

### Files to Update

| File | Change |
|------|--------|
| `packages/tag/src/name/tag-name.schema.ts` | Integrate `validateDisplayName` |
| `apps/web/src/features/tag/router/procedures/create-tag.ts` | Use `normalizeDisplayName` |
| `apps/web/src/features/tag/router/procedures/update-tag.ts` | Use `normalizeDisplayName` |
| `apps/web/src/app/api/v1/tag/route.ts` | Use `normalizeDisplayName` |
| `apps/web/src/test-utils/test-db.ts` | Use `normalizeDisplayName` in `createTestTag` |

### Migration

No database migration needed. The change only affects how values are normalized before storage:

1. Existing data is already lowercase (from current `.toLowerCase()`)
2. New normalization produces same result for ASCII text
3. Only international text gets improved handling

### Edge Cases

#### German Eszett (ß)

```typescript
// toLocaleLowerCase('und') behavior may vary:
"ß".toLocaleLowerCase('und') // "ß" (stays same, already lowercase)
"ẞ".toLocaleLowerCase('und') // "ß" (capital eszett → lowercase)

// For strict uniqueness, consider explicit expansion:
// "straße" and "strasse" should match
```

#### Turkish İ/I

```typescript
// Turkish has dotted and dotless i
"İ".toLocaleLowerCase('und')  // "i̇" (i with combining dot above) or "i"
"I".toLocaleLowerCase('und')  // "i"

// Using 'und' locale avoids Turkish-specific rules
// which would make "I" → "ı" (dotless i)
```

### Length Validation Strategy

Since PostgreSQL counts codepoints and JS counts UTF-16 code units:

```typescript
function countCodepoints(str: string): number {
  return [...str].length; // Spreads by codepoints, not code units
}

// Or use Intl.Segmenter for grapheme clusters (visual characters)
function countGraphemes(str: string): number {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return [...segmenter.segment(str)].length;
}
```

**Recommendation**: Use codepoint count (`[...str].length`) to match PostgreSQL behavior, and reject emoji to avoid grapheme complexity.

### Future Extensions

1. **Confusable detection** — Warn/block Cyrillic "а" vs Latin "a" lookalikes (homoglyph attacks)
2. **Script consistency** — Optionally require single-script tags (no mixing Cyrillic with Latin)
3. **Transliteration option** — Convert "Привет" → "Privet" for ASCII-only contexts
4. **Locale-aware sorting** — Use `Intl.Collator` for proper international alphabetical order

---

## Convention: Keep Procedure Schemas Inline

> **Status**: Adopted
> **Priority**: Low
> **Type**: Code Organization Convention

### Overview

An analysis of tRPC procedure files in the codebase revealed two patterns for organizing input validation schemas:

1. **Separate files**: Schemas in dedicated `schemas/` folder, imported by procedures
2. **Inline**: Schemas defined directly in the procedure file

### Analysis Results

| Pattern | Feature | Examples |
|---------|---------|----------|
| **Separate** | Tag | `create-tag`, `delete-tag`, `update-tag` |
| **Separate** | Deck | `create-deck`, `update-deck`, `schedule-deck-deletion`, `restore-deck` |
| **Inline** | Deck | `add-url-to-deck`, `remove-url-from-deck`, `toggle-follow-deck`, `get-deck-by-slug` |
| **Inline** | URL | `update-user-url` |
| **Inline** | User-profile | `create-user-profile`, `update-user-profile` |
| **Inline** | Feed | `get-user-feed`, `toggle-like-url` |
| **Inline** | Tag | `get-user-tags` |

### Decision: Keep Schemas Inline

**Recommendation**: Define procedure schemas inline within procedure files.

#### Reasons

1. **Colocation improves discoverability** — When the schema is in the same file as the procedure, you see the full contract (input validation, business logic, output) in one place. No context-switching or file-hopping required.

2. **Easier refactoring** — Procedure-specific schemas rarely need reuse. When you rename a field, change validation, or delete the procedure entirely, having everything in one file makes changes atomic and reduces the risk of orphaned schema files.

3. **Lower cognitive overhead** — Separate files only pay off when schemas are genuinely shared. If each schema is only imported once, the extra indirection adds friction without benefit.

4. **Type exports still work** — You can still export the inferred types (`export type XSchema = z.infer<typeof xSchema>`) directly from the procedure file for use in UI components or API consumers.

#### When to Use Separate Schema Files

Separate schema files are still appropriate when:

- The schema is **reused** across multiple procedures (rare in this codebase)
- The schema requires **complex validation logic** with accompanying tests
- The schema is **part of a shared package** (e.g., `@repo/deck/schemas/*` in packages, not feature-local `schemas/` folders)

### Cleanup Tasks

Move existing separate schemas into their corresponding procedure files:

- [ ] `apps/web/src/features/tag/schemas/create-tag.schema.ts` → inline in `create-tag.ts`
- [ ] `apps/web/src/features/tag/schemas/delete-tag.schema.ts` → inline in `delete-tag.ts`
- [ ] `apps/web/src/features/tag/schemas/update-tag.schema.ts` → inline in `update-tag.ts`
- [ ] `apps/web/src/features/deck/schemas/create-deck.schema.ts` → inline in `create-deck.ts`
- [ ] `apps/web/src/features/deck/schemas/update-deck.schema.ts` → inline in `update-deck.ts`
- [ ] `apps/web/src/features/deck/schemas/schedule-deck-deletion.schema.ts` → inline in `schedule-deck-deletion.ts`
- [ ] `apps/web/src/features/deck/schemas/restore-deck.schema.ts` → inline in `restore-deck.ts`
- [ ] Delete empty `schemas/` folders after migration

### Pattern Example

```typescript
// ✅ Recommended: Inline schema in procedure file
// apps/web/src/features/deck/router/procedures/add-url-to-deck.ts

import { deckIdSchema } from "@repo/db/id/deck-id";
import { userUrlIdSchema } from "@repo/db/id/user-url-id";
import { z } from "zod";

// Schema defined inline, right before the procedure
const addUrlToDeckSchema = z.object({
  deckId: deckIdSchema,
  userUrlId: userUrlIdSchema,
});

export type AddUrlToDeckSchema = z.infer<typeof addUrlToDeckSchema>;

export const addUrlToDeck = protectedProcedure
  .input(addUrlToDeckSchema)
  .mutation(async ({ input, ctx }) => {
    // ... procedure logic
  });
```

```typescript
// ❌ Avoid: Separate schema file for single-use schema
// apps/web/src/features/deck/schemas/add-url-to-deck.schema.ts
export const addUrlToDeckSchema = z.object({ ... });

// apps/web/src/features/deck/router/procedures/add-url-to-deck.ts
import { addUrlToDeckSchema } from "../../schemas/add-url-to-deck.schema";
// ... procedure
```

### Note on Package Schemas

This convention applies to **feature-local schemas** in `apps/web/src/features/*/`.

**Package schemas** (in `packages/*/src/schemas/`) follow a different pattern — they are intentionally extracted for cross-package reuse (e.g., `@repo/deck/schemas/deck-slug.schema.ts` used by both web app and API validation).

---

## Add `typecheck` Scripts to All Packages

> **Status**: Planning
> **Priority**: Low
> **Dependencies**: None

### Overview

Enable running TypeScript type checking from the repository root using Turborepo. Add a `typecheck` script to all packages/apps so it can be run via `pnpm typecheck` from the root.

### Current State

**`turbo.json`** has `check-types` task, needs to be renamed to `typecheck`:
```json
{
  "tasks": {
    "check-types": {  // rename to "typecheck"
      "dependsOn": ["^check-types"]
    }
  }
}
```

**Root `package.json`** has `check-types`, needs to be renamed to `typecheck`:
```json
{
  "scripts": {
    "check-types": "turbo run check-types"  // rename to "typecheck": "turbo run typecheck"
  }
}
```

Packages have inconsistent or missing scripts:

| Package/App | Script Name | Status |
|-------------|-------------|--------|
| `apps/web` | `typecheck` | ✅ Correct |
| `apps/docs` | `check-types` | ❌ Rename to `typecheck` |
| `apps/browser-extension` | `compile` | ❌ Rename to `typecheck` |
| `packages/ui` | `check-types` | ❌ Rename to `typecheck` |
| `packages/db` | — | ❌ Missing |
| `packages/shared` | — | ❌ Missing |
| `packages/deck` | — | ❌ Missing |
| `packages/tag` | — | ❌ Missing |
| `packages/crypto` | — | ❌ Missing |
| `packages/url` | — | ❌ Missing |
| `packages/user` | — | ❌ Missing |
| `packages/user-profile` | — | ❌ Missing |
| `packages/metadata-scrapper` | — | ❌ Missing |
| `packages/tests-setup` | — | ❌ Missing |

### Implementation Steps

#### 1. Update Turborepo Config

- [ ] `turbo.json`: Rename `check-types` task → `typecheck`
- [ ] Root `package.json`: Rename script `check-types` → `typecheck`

#### 2. Standardize Script Names

Rename existing scripts:

- [ ] `apps/docs/package.json`: Rename `check-types` → `typecheck`
- [ ] `apps/browser-extension/package.json`: Rename `compile` → `typecheck`
- [ ] `packages/ui/package.json`: Rename `check-types` → `typecheck`

#### 3. Add Missing Scripts

Add `"typecheck": "tsc --noEmit"` to all packages:

- [ ] `packages/db/package.json`
- [ ] `packages/shared/package.json`
- [ ] `packages/deck/package.json`
- [ ] `packages/tag/package.json`
- [ ] `packages/crypto/package.json`
- [ ] `packages/url/package.json`
- [ ] `packages/user/package.json`
- [ ] `packages/user-profile/package.json`
- [ ] `packages/metadata-scrapper/package.json`
- [ ] `packages/tests-setup/package.json`

#### 4. Verification

After adding all scripts, verify from root:

```bash
# Should run type checking across all packages
pnpm typecheck

# Should show all packages being checked
pnpm turbo run typecheck --dry-run
```

### Script Template

For each package, add:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

### Notes

- The `^typecheck` dependency in turbo.json ensures dependencies are type-checked first
- Each package needs its own `tsconfig.json` for `tsc --noEmit` to work
- Packages without TypeScript files can use a no-op: `"typecheck": "echo 'No TypeScript to check'"`
- Consider adding `typecheck` to CI pipeline after implementation

---

## Generate App Rules and Regulations

> **Status**: Planning
> **Priority**: Medium
> **Dependencies**: None

### Overview

Create comprehensive rules and regulations documentation for the LinkDeck application. This includes legal pages, terms of service, privacy policy, and community guidelines that users must agree to when using the platform.

### Required Documents

| Document | Purpose | Route |
|----------|---------|-------|
| **Terms of Service** | Legal agreement governing use of the platform | `/terms` |
| **Privacy Policy** | How user data is collected, stored, and used | `/privacy` |
| **Community Guidelines** | Acceptable content and behavior standards | `/guidelines` |
| **Cookie Policy** | Information about cookies and tracking | `/cookies` |
| **Acceptable Use Policy** | What content can/cannot be shared via decks | `/acceptable-use` |

### Key Considerations

#### Content Policies
- [ ] Define what types of URLs/content are prohibited (illegal, harmful, spam)
- [ ] Establish rules for public deck content
- [ ] Define moderation policies and enforcement actions
- [ ] Account suspension/termination criteria

#### Data & Privacy
- [ ] Data collection practices (Clerk auth, URL metadata, analytics)
- [ ] Data retention periods
- [ ] User rights (access, deletion, export)
- [ ] Third-party services disclosure (Supabase, Clerk, etc.)
- [ ] GDPR compliance requirements

#### Platform Usage
- [ ] API usage limits and terms
- [ ] Browser extension data handling
- [ ] Deck limits and pricing plan terms
- [ ] Intellectual property rights (user content ownership)

### Implementation Steps

1. **Draft content** — Write initial versions of all policy documents
2. **Legal review** — Have documents reviewed for legal compliance
3. **Create pages** — Add static pages to the web app
4. **User consent** — Add consent checkboxes during registration
5. **Version tracking** — Implement policy version history and user consent tracking

### Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/app/(legal)/terms/page.tsx` | Terms of Service page |
| `apps/web/src/app/(legal)/privacy/page.tsx` | Privacy Policy page |
| `apps/web/src/app/(legal)/guidelines/page.tsx` | Community Guidelines page |
| `apps/web/src/app/(legal)/cookies/page.tsx` | Cookie Policy page |
| `apps/web/src/app/(legal)/acceptable-use/page.tsx` | Acceptable Use Policy page |
| `apps/web/src/app/(legal)/layout.tsx` | Shared layout for legal pages |

### Notes

- Consider using MDX for easier content management
- Include "Last Updated" dates on all documents
- Provide summary/TL;DR sections for key policies
- Ensure mobile-friendly formatting for long documents

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CODING-GUIDELINE.md](./CODING-GUIDELINE.md) - Development standards
- [DESIGN.md](./DESIGN.md) - UX specifications
- [deck-deletion-analysis.md](./deck-deletion-analysis.md) - Detailed analysis of deletion strategies

---

*This plan was developed through iterative discussion. See conversation history for detailed rationale.*
