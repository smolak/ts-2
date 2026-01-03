# Feature Plan: Decks (Multi-Profile URL Organization)

> **Status**: Active Development
> **Created**: December 7, 2025
> **Last Updated**: January 3, 2025

## Table of Contents

- [Feature Plan: Decks (Multi-Profile URL Organization)](#feature-plan-decks-multi-profile-url-organization)
  - [Table of Contents](#table-of-contents)
  - [Completed Work](#completed-work)
  - [Overview](#overview)
    - [Problem Statement](#problem-statement)
    - [Solution: Decks](#solution-decks)
    - [Why "Deck"?](#why-deck)
  - [Key Decisions](#key-decisions)
    - [1. Decks as an Additional Layer (Not Replacement)](#1-decks-as-an-additional-layer-not-replacement)
    - [2. Follow Decks, Not Users](#2-follow-decks-not-users)
    - [3. Tags Still Work Independently](#3-tags-still-work-independently)
    - [4. Feed Population](#4-feed-population)
  - [Schema Design](#schema-design)
    - [Core Tables](#core-tables)
    - [Dependency Graph](#dependency-graph)
  - [Pricing Plans \& Deck Limits](#pricing-plans--deck-limits)
    - [Plan Tiers](#plan-tiers)
    - [Enforcement](#enforcement)
  - [Decisions Made](#decisions-made)
    - [Naming](#naming)
    - [Default Behavior](#default-behavior)
    - [Counts \& Stats](#counts--stats)
    - [Privacy Model](#privacy-model)
  - [Open Questions (Deferred)](#open-questions-deferred)
    - [Discovery (Phase 2+)](#discovery-phase-2)
    - [Browser Extension](#browser-extension)
    - [Advanced Features (Future)](#advanced-features-future)
  - [Future: URL Hashes Tables Usage](#future-url-hashes-tables-usage)
  - [User Account Deletion Strategy](#user-account-deletion-strategy)
    - [Overview](#overview-1)
    - [User Flow](#user-flow)
    - [Behavior During Grace Period](#behavior-during-grace-period)
    - [Implementation Phases](#implementation-phases)
    - [Open Questions](#open-questions)
  - [Phase 10: Drop Deprecated `follows` Table](#phase-10-drop-deprecated-follows-table)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
  - [Refactor: Rename `usernameNormalized` to `slug` in User Profiles](#refactor-rename-usernamenormalized-to-slug-in-user-profiles)
  - [Refactor: Standardize `name` / `display_name` Column Convention](#refactor-standardize-name--display_name-column-convention)
  - [Cleanup: Remove Unnecessary Defensive Checks After Drizzle Inserts](#cleanup-remove-unnecessary-defensive-checks-after-drizzle-inserts)
  - [Utility: International Display Name Normalization](#utility-international-display-name-normalization)
    - [Proposed Solution](#proposed-solution)
    - [Decision: Disallow Emoji in Tags](#decision-disallow-emoji-in-tags)
  - [Convention: Keep Procedure Schemas Inline](#convention-keep-procedure-schemas-inline)
    - [Cleanup Tasks](#cleanup-tasks)
  - [Add `typecheck` Scripts to All Packages](#add-typecheck-scripts-to-all-packages)
  - [Generate App Rules and Regulations](#generate-app-rules-and-regulations)
  - [References](#references)

---

## Completed Work

> For historical reference of completed phases and tasks, see [PLAN-ARCHIVE.md](./PLAN-ARCHIVE.md)

Completed sections archived:
- ✅ Migration Strategy
- ✅ File Structure  
- ✅ API Procedure Specifications
- ✅ Implementation Phases 1-8
- ✅ Testing Strategy
- ✅ Edge Cases: When Deck is Made Private
- ✅ Remove Soft Delete for URLs
- ✅ Database Query Performance Audit
- ✅ Refactoring: Use tRPC Procedures
- ✅ Security Fixes
- ✅ Phase 9: Integration Tests Infrastructure
- ✅ Feed Query Cleanup: Remove Tag Filtering

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

---

## Schema Design

### Core Tables

```sql
-- Decks with rich metadata
CREATE TABLE decks (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  is_public BOOLEAN DEFAULT true NOT NULL,
  urls_count INTEGER DEFAULT 0 NOT NULL,
  followers_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ,
  scheduled_for_deletion_at TIMESTAMPTZ,
  UNIQUE(user_id, slug)
);

-- Junction: URLs in Decks
CREATE TABLE deck_urls (
  deck_id CHAR(26) NOT NULL REFERENCES decks(id) ON DELETE RESTRICT,
  user_url_id CHAR(26) NOT NULL REFERENCES users_urls(id) ON DELETE RESTRICT,
  added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (deck_id, user_url_id)
);

-- Deck Follows (replaces user follows)
CREATE TABLE deck_follows (
  deck_id CHAR(26) NOT NULL REFERENCES decks(id) ON DELETE RESTRICT,
  follower_id CHAR(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (deck_id, follower_id)
);
```

### Dependency Graph

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
  - decks → users

Level 2 - DEPEND ON LEVEL 1:
  - userUrlsTags → usersUrls, tags
  - feeds → users, usersUrls, decks
  - usersUrlsInteractions → usersUrls, users, interactionTypes
  - deckUrls → decks, usersUrls
  - deckFollows → decks, users

DEPRECATED (to remove):
  - follows → users
```

---

## Pricing Plans & Deck Limits

### Plan Tiers

| Plan | Public Decks | Private Decks | Total Decks |
|------|--------------|---------------|-------------|
| **Free** | 3 | 1 | 4 |
| **Medium** | 10 | 5 | 15 |
| **Pro** | Unlimited | Unlimited | Unlimited |

### Enforcement

Limits are defined in `packages/deck/src/config/deck-limits.ts` and checked via `canCreateDeck()` at:
- Deck creation
- Visibility changes (private → public or vice versa)

---

## Decisions Made

### Naming
- Feature name: **Deck** (brand alignment with LinkDeck)
- URL pattern: `/@username/slug` (shorter, cleaner)

### Default Behavior
- New users: **No default deck** - users create decks intentionally
- URLs without deck: Show in "All URLs" view
- Sharing flow: Deck selection **optional**

### Counts & Stats
- `userProfiles.followersCount`: **Sum of unique deck followers** (deduplicated)

### Privacy Model
- Private decks: Cannot be followed, not shown on public profile
- Public decks: Followable, shown on public profile
- URLs can be in both public and private decks simultaneously

---

## Open Questions (Deferred)

### Discovery (Phase 2+)
- [ ] Global deck discovery page? (trending decks, popular decks)
- [ ] Deck search?
- [ ] Recommended decks based on interests?

### Browser Extension
- [ ] Remember last used deck? ✅ Implemented
- [ ] Quick deck switching?
- [ ] Create new deck from extension?

### Advanced Features (Future)
- [ ] Collaborative decks (multiple editors)?
- [ ] Deck templates?
- [ ] Import/export decks?

---

## Future: URL Hashes Tables Usage

The `url_hashes` and `url_hashes_compound_hashes_counts` tables are currently populated but not consumed. Planned features:

- [ ] Show "shared X times" on URL cards
- [ ] Trending URLs feature based on share counts
- [ ] Alert when `compoundHashesCount > 1` (same URL, different metadata)
- [ ] Admin tool to merge duplicate URL entries

---

## User Account Deletion Strategy

> **Status**: Planning
> **Priority**: Medium
> **Dependencies**: Background job infrastructure

### Overview

User account deletion follows the **pending deletion pattern** with a 30-day grace period for GDPR compliance.

### User Flow

```
User clicks "Delete Account" → Confirmation required
        ↓
users.scheduledForDeletionAt = now() + 30 days
        ↓
Email sent: "Your account will be deleted on [date]"
        ↓
User can cancel within 30 days
        ↓
Background job (daily) hard deletes in dependency order
```

### Behavior During Grace Period

| Feature | Behavior |
|---------|----------|
| Login | Allowed (to cancel) |
| Add new URLs | Blocked |
| Public profile | Hidden |
| API access | Blocked |

### Implementation Phases

1. Schema: Add `scheduledForDeletionAt` to users table
2. API: Create `scheduleAccountDeletion` and `cancelAccountDeletion` procedures
3. UI: Settings page with deletion flow
4. Background Job: Daily cleanup job
5. Queries: Filter pending-deletion users
6. Notifications: Email system

### Open Questions

- [ ] Background job infrastructure? (Cron, queue, Supabase Edge Functions?)
- [ ] Reminder emails before final deletion?
- [ ] Export data option? (GDPR requirement)

---

## Phase 10: Drop Deprecated `follows` Table

> **Status**: Planning
> **Priority**: Low
> **Dependencies**: Deck-follows stable in production for 2+ weeks

### Prerequisites

- [ ] Deck-follows running without issues for 2+ weeks
- [ ] No code references `follows` table
- [ ] Historical data migrated or no longer needed

### Steps

1. Search for remaining references
2. Remove Drizzle schema (`follows` table, `Follow` type)
3. Create migration: `DROP TABLE follows`
4. Verify with typecheck and tests

---

## Refactor: Rename `usernameNormalized` to `slug` in User Profiles

> **Status**: Planning
> **Priority**: Low

Rename `user_profiles.usernameNormalized` to `slug` for consistency with deck pattern:
- `username` — display name ("JohnDoe")
- `slug` — URL identifier ("johndoe")

Migration: `ALTER TABLE user_profiles RENAME COLUMN username_normalized TO slug;`

---

## Refactor: Standardize `name` / `display_name` Column Convention

> **Status**: Planning
> **Priority**: Low

Current patterns are inconsistent:
- `tags`: `name` + `displayName` ✅
- `decks`: `name` + `slug` (URL pattern)
- `userProfiles`: `username` + `usernameNormalized` ❌

Recommendation: Use `name`/`display_name` for searchable values, `name`/`slug` for URL identifiers.

---

## Cleanup: Remove Unnecessary Defensive Checks After Drizzle Inserts

> **Status**: Planning
> **Priority**: Low

Remove `if (!result)` checks after Drizzle `.returning()` calls - Drizzle throws on failures, so these are unreachable.

Files to update:
- `apps/web/src/features/url/api/v1/add-url/index.ts`
- `apps/web/src/test-utils/test-db.ts`
- `apps/web/src/server/api/trpc.ts`

---

## Utility: International Display Name Normalization

> **Status**: Planning
> **Priority**: Medium

Current `.toLowerCase().trim()` has limitations with international text.

### Proposed Solution

1. `normalizeDisplayName()` - NFC normalization + Unicode case folding
2. `validateDisplayName()` - Security checks (no emoji, control chars, zero-width)

### Decision: Disallow Emoji in Tags

Tags are for organization, not decoration. Simpler validation, consistent search.

---

## Convention: Keep Procedure Schemas Inline

> **Status**: Adopted
> **Priority**: Low

Define procedure schemas inline within procedure files (not in separate `schemas/` folders) for:
- Better discoverability
- Easier refactoring
- Lower cognitive overhead

### Cleanup Tasks

- [ ] Move `apps/web/src/features/tag/schemas/*.ts` inline
- [ ] Move `apps/web/src/features/deck/schemas/*.ts` inline
- [ ] Delete empty `schemas/` folders

---

## Add `typecheck` Scripts to All Packages

> **Status**: Planning
> **Priority**: Low

Add `"typecheck": "tsc --noEmit"` to all packages for root-level `pnpm typecheck`.

Packages missing script:
- `packages/db`
- `packages/shared`
- `packages/deck`
- `packages/tag`
- `packages/crypto`
- `packages/url`
- `packages/user`
- `packages/user-profile`
- `packages/metadata-scrapper`
- `packages/tests-setup`

---

## Generate App Rules and Regulations

> **Status**: Planning
> **Priority**: Medium

Create legal documentation:
- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)
- Community Guidelines (`/guidelines`)
- Cookie Policy (`/cookies`)
- Acceptable Use Policy (`/acceptable-use`)

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CODING-GUIDELINE.md](./CODING-GUIDELINE.md) - Development standards
- [DESIGN.md](./DESIGN.md) - UX specifications
- [PLAN-ARCHIVE.md](./PLAN-ARCHIVE.md) - Completed work history

---

*Plan maintained through iterative development. Last cleanup: January 3, 2025*
