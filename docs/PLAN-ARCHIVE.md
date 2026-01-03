# Feature Plan: Decks - Completed Work Archive

> This file contains completed sections from PLAN.md for historical reference.
> For active planning, see [PLAN.md](./PLAN.md).

---

## Table of Contents

1. [Migration Strategy](#migration-strategy) ✅
2. [File Structure](#file-structure) ✅
3. [API Procedure Specifications](#api-procedure-specifications) ✅
4. [Implementation Phases 1-8](#implementation-phases) ✅
5. [Testing Strategy](#testing-strategy) ✅
6. [Edge Cases: When Deck is Made Private](#edge-cases--considerations) ✅
7. [Remove Soft Delete for URLs](#remove-soft-delete-for-urls) ✅
8. [Database Query Performance Audit](#database-query-performance-audit) ✅
9. [Refactoring: Use tRPC Procedures](#refactoring-use-trpc-procedures-instead-of-direct-db-queries) ✅
10. [Security Fixes](#security-fixes-priority) ✅
11. [Phase 9: Integration Tests Infrastructure](#phase-9-integration-tests-infrastructure-for-trpc-procedures) ✅
12. [Feed Query Cleanup: Remove Tag Filtering](#feed-query-cleanup-remove-tag-filtering) ✅

---

## Migration Strategy

> **Status**: ✅ Complete

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

> **Status**: ✅ Complete

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

> **Status**: ✅ Complete - All procedures implemented

### Deck CRUD

#### `createDeck`
- Input: name, slug, description (optional), imageUrl (optional), color (optional), isPublic
- Output: { deckId, slug }
- Enforces plan limits via `canCreateDeck()`

#### `updateDeck`
- Input: deckId, name (optional), slug (optional), description (optional), imageUrl (optional), color (optional), isPublic (optional)
- Output: { deckId, slug }
- Checks limits when changing visibility

#### `deleteDeck`
- Input: deckId
- Output: { deleted: true }
- Cascades to deck_urls, deck_follows

#### `getUserDecks`
- Input: none (uses ctx.userId)
- Output: Array of deck DTOs

#### `getDeckBySlug`
- Input: username, slug
- Output: Deck with owner info and isFollowing flag

### Deck URLs

#### `addUrlToDeck`
- Input: deckId, userUrlId
- Output: { added: true, deckId, urlsCount }
- Fans out to followers' feeds if deck is public

#### `removeUrlFromDeck`
- Input: deckId, userUrlId
- Output: { removed: true, urlsCount }

### Deck Follows

#### `toggleFollowDeck`
- Input: deckId
- Output: { status: "following" | "unfollowed", deckId, followersCount }

#### `getFollowedDecks`
- Input: none (uses ctx.userId)
- Output: Array of followed deck DTOs with owner info

---

## Implementation Phases

> **Status**: ✅ Complete (Phases 1-8)

### Phase 1: Database Foundation ✅
- All schema changes applied
- ID generation implemented
- Migration `0006_add_decks_schema.sql` complete

### Phase 2: Validation Package ✅
- `packages/deck/` created with all schemas
- Deck limits configuration implemented

### Phase 3: Backend API ✅
- All 11 deck procedures implemented
- Feed integration complete

### Phase 4: Web UI - Settings ✅
- Deck settings page at `/settings/decks`
- Create, edit, delete deck forms
- Deck limits usage display
- Note: `upgrade-prompt.tsx` deferred

### Phase 5: Web UI - Public Deck Page ✅
- `/@username/slug` route
- Deck header, URL list, follow button

### Phase 6: Web UI - Deck Picker & Integration ✅
- Deck picker for URL sharing
- Public decks grid on profile
- Feed deck filter

### Phase 7: Browser Extension ✅
- Deck picker in extension popup
- Default deck preference saved

### Phase 8: Migration & Cleanup ✅
- Follow User button removed
- `followUserRouter` removed
- `feeds.deckId` now NOT NULL
- Note: `follows` table drop deferred to Phase 10

---

## Testing Strategy

> **Status**: ✅ Reference (tests implemented per Phase 9)

### Unit Tests
- `packages/deck/src/schemas/*.test.ts` - Validation rules

### Integration Tests
- `apps/web/src/features/deck/router/procedures/*.test.ts`
- Using real test database per CODING-GUIDELINE.md

### Key Test Cases Implemented
- Deck limits enforcement
- Deck CRUD operations
- URL management in decks
- Following/unfollowing
- Feed integration
- Privacy edge cases

---

## Edge Cases & Considerations

### When Deck is Made Private

> **Status**: ✅ Complete
> **Decision**: Option B (Remove all followers)
> **Completed**: December 28, 2025

When a deck becomes private:
1. All `deck_follows` entries deleted
2. `deck.followersCount` reset to 0
3. Profile `followersCount` updated (deduplicated)
4. Feed entries kept as historical record
5. New follows blocked

Implementation in `update-deck.ts` procedure.

### When URL is Deleted
- Currently URLs cannot be deleted
- Future: See "User Account Deletion Strategy" in PLAN.md

### Slug Conflicts
- Unique per user (`UNIQUE(user_id, slug)`)
- Validation error shown immediately

### Feed Deduplication
- Handled by `feeds` table structure (one entry per user-userUrl)

---

## Remove Soft Delete for URLs

> **Status**: ✅ Complete
> **Completed**: December 28, 2025

Removed unused `isDeleted` column from `users_urls` table:
- Removed filters from queries
- Updated schema
- Migration `0010_remove_soft_delete_for_urls.sql`

---

## Database Query Performance Audit

> **Status**: ✅ Complete
> **Completed**: January 2, 2025

All procedures audited and optimized:

| Category | Procedures Optimized |
|----------|---------------------|
| Deck | 13 procedures |
| Feed | 3 procedures |
| Tag | 4 procedures |
| URL | 2 procedures |
| User Profile | 5 procedures |

Key optimizations applied:
- Parallel queries via `Promise.all`
- Column selection to limit data transfer
- SQL-level filtering vs JavaScript
- Compound indexes for filter+sort patterns

Migration: `0011_improve_index.sql`

---

## Refactoring: Use tRPC Procedures Instead of Direct DB Queries

> **Status**: ✅ Complete
> **Completed**: 2025-01-03

### Files Audited

#### Server Components
- [x] `apps/web/src/app/[username]/page.tsx` - Refactored to use tRPC
- [x] Other page.tsx files - No direct db.query calls found

#### API Routes (v1)
- [x] `/api/v1/tag/route.ts` - Uses shared service functions
- [x] `/api/v1/deck/route.ts` - Refactored to use `getUserDecks` service
  - 🐛 Fixed bug: tRPC `getUserDecks` was missing `scheduledForDeletionAt` filter

#### Feature-level API Functions
- [x] `add-url/index.ts` - Correct service function pattern
- [x] `get-user-feed.ts` - Correct query builder pattern

#### Utilities
- [x] `get-user-id-from-request.ts` - Correct auth utility pattern

---

## Security Fixes (Priority)

> **Status**: ✅ Complete
> **Completed**: December 18, 2025

### Issues Fixed

1. **Tag Update** - Added `userId` filter to UPDATE WHERE clause
2. **Tag Delete** - Added `userId` filter to DELETE WHERE clause
3. **URL Tags Update** - Added `userId` filter to tag counter updates
4. **Add URL API** - Added `userId` filter to tag counter updates

Tests added for issues #1-#2. Issues #3-#4 tests blocked by multi-table test infrastructure issue.

---

## Phase 9: Integration Tests Infrastructure for tRPC Procedures

> **Status**: ✅ Complete
> **Completed**: December 27, 2025

### Files Created
- `apps/web/src/test-utils/create-test-context.ts`
- `apps/web/src/test-utils/test-db.ts`
- `apps/web/src/test-utils/index.ts`
- `apps/web/src/test-utils/server-only-mock.ts`

### Tests Implemented
- `delete-tag.test.ts` (5 tests)
- `update-tag.test.ts` (10 tests)
- `create-tag.test.ts` (7 tests)
- `get-user-tags.test.ts` (7 tests)

### Known Issue: Multi-Table Procedure Tests
Tests for procedures involving multiple tables fail due to context isolation issues. See PLAN.md for investigation notes.

---

## Feed Query Cleanup: Remove Tag Filtering

> **Status**: ✅ Complete
> **Completed**: December 27, 2025

Removed tag filtering from feed queries:
- Tag filtering only available in deck-specific views
- Performance improved by removing complex subqueries
- Tag names still displayed via STRING_AGG

### Deck Tag Filtering Implementation ✅
- Added `tagIds` parameter to `get-deck-urls.ts`
- Created `deck-content.tsx` with tag filter UI
- Tags scoped to deck context where filtering is meaningful

---

*Archive created: 2025-01-03*
*See [PLAN.md](./PLAN.md) for active planning items.*

