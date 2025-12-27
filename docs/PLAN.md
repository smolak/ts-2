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
11. [Security Fixes (Priority)](#security-fixes-priority)
12. [Phase 9: Integration Tests Infrastructure](#phase-9-integration-tests-infrastructure-for-trpc-procedures)
13. [User Account Deletion Strategy](#user-account-deletion-strategy)
14. [Refactor: Rename usernameNormalized to slug](#refactor-rename-usernamenormalized-to-slug-in-user-profiles)

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

**Note:** Made `deckId` nullable in feeds table during transition period to support both old user-follows (no deck context) and new deck-follows. Will be made NOT NULL after Phase 8 migration.

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

- [ ] Remove "Follow User" button from UI
- [ ] Update `userProfiles.followersCount` to reflect deck followers
- [ ] Add deprecation warning to `follows` table queries
- [ ] (Future release) Drop `follows` table

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
   - Deck made private while has followers (unfollow all?)

---

## Edge Cases & Considerations

### When Deck is Made Private

**Option A (Recommended):** Keep existing followers, stop new follows
- Existing followers continue to see future URLs (grandfathered)
- No new followers can follow
- Display: "Following (private)" badge

**Option B:** Remove all followers
- Automatic unfollow when made private
- Cleaner but more disruptive

### When URL is Deleted (soft delete)

- `users_urls.is_deleted = true`
- `deck_urls` entries remain (for audit)
- URL stops appearing in deck views (filter by `is_deleted = false`)

### Slug Conflicts

- Slugs unique per user (`UNIQUE(user_id, slug)`)
- Auto-suggest: "free-games" → "free-games-2" if taken
- Or: Show validation error immediately

### Feed Deduplication

If same URL is in multiple decks user follows, show once in feed.
Already handled by `feeds` table structure (one entry per user-userUrl).

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

- [ ] Test: Cannot update tag belonging to another user
- [ ] Test: Cannot delete tag belonging to another user
- [ ] Test: Cannot manipulate tag counters via crafted `tagIds` in `updateUserUrl`
- [ ] Test: Cannot manipulate tag counters via crafted `tagIds` in `addUrl` API

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

> **Status**: Pending
> **Priority**: Medium
> **Dependencies**: None (can be done independently)

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

### Files to Create

Test utilities:
- [ ] `apps/web/src/test-utils/create-test-context.ts` - Factory for creating test tRPC context
- [ ] `apps/web/src/test-utils/test-db.ts` - Test database setup/teardown helpers
- [ ] `apps/web/src/test-utils/index.ts` - Barrel exports

Procedure tests (start with tag procedures as reference implementation):
- [ ] `apps/web/src/features/tag/router/procedures/delete-tag.test.ts`
- [ ] `apps/web/src/features/tag/router/procedures/update-tag.test.ts`
- [ ] `apps/web/src/features/tag/router/procedures/create-tag.test.ts`
- [ ] `apps/web/src/features/tag/router/procedures/get-user-tags.test.ts`

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

Options to evaluate:
1. **Supabase local** - Use local Supabase instance for tests
2. **PostgreSQL container** - Use Testcontainers for isolated test DB
3. **Transaction rollback** - Wrap each test in transaction, rollback after

### Verification

After implementation:
- [ ] All tag procedure tests pass
- [ ] Security fix tests from Issue #1-#4 are covered
- [ ] Pattern documented for other procedure tests
- [ ] CI pipeline runs integration tests

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

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CODING-GUIDELINE.md](./CODING-GUIDELINE.md) - Development standards
- [DESIGN.md](./DESIGN.md) - UX specifications
- [deck-deletion-analysis.md](./deck-deletion-analysis.md) - Detailed analysis of deletion strategies

---

*This plan was developed through iterative discussion. See conversation history for detailed rationale.*
