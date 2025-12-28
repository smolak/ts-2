# @repo/deck

Deck validation schemas, configuration, and utilities for the LinkDeck platform.

## Overview

A **Deck** is a named, curated collection of URLs with rich metadata. Users can create multiple decks to organize their URLs into separate contexts (personal, topic-specific, public/private).

## Installation

This package is part of the monorepo and is available as `@repo/deck`.

## Usage

### Validation Schemas

```typescript
import { deckNameSchema, DECK_NAME_MAX_LENGTH } from "@repo/deck/schemas/deck-name.schema";
import { deckSlugSchema, DECK_SLUG_MAX_LENGTH } from "@repo/deck/schemas/deck-slug.schema";
import { deckMetadataSchema, DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";

// Validate deck name
const name = deckNameSchema.parse("Free Games"); // ✅

// Validate deck slug
const slug = deckSlugSchema.parse("free-games"); // ✅

// Validate deck metadata
const metadata = deckMetadataSchema.parse({
  description: "A collection of free games",
  imageUrl: "https://example.com/image.png",
  color: "#FF5733",
}); // ✅
```

### Plan Limits

```typescript
import { canCreateDeck, canChangeDeckVisibility, getDeckLimits, DECK_LIMITS } from "@repo/deck/config/deck-limits";

// Check if user can create a deck
const result = canCreateDeck("free", 2, 1, true);
if (result.allowed) {
  // Create the deck
} else {
  console.log(result.reason); // "You've reached the maximum of 3 public decks on the free plan."
}

// Check if user can change deck visibility
const changeResult = canChangeDeckVisibility("free", 3, 0, true, false);
if (changeResult.allowed) {
  // Change visibility
}

// Get limits for a plan
const limits = getDeckLimits("medium");
// { maxPublicDecks: 10, maxPrivateDecks: 5, maxTotalDecks: 15 }
```

### DTO

```typescript
import { toDeckDto, DeckDto } from "@repo/deck/dto/deck.dto";

const deckDto = toDeckDto(deckFromDatabase);
```

## Schemas

### `deckNameSchema`

Validates deck display names:
- Required, non-empty
- Maximum 50 characters
- Trimmed whitespace
- Supports unicode and emoji

### `deckSlugSchema`

Validates URL-friendly slugs:
- Required, non-empty
- Maximum 50 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen

### `deckMetadataSchema`

Validates optional deck metadata:
- `description` - Optional, max 500 characters
- `imageUrl` - Optional, valid URL
- `color` - Optional, valid hex color (#RRGGBB)

## Plan Limits

| Plan     | Public Decks | Private Decks | Total Decks |
|----------|--------------|---------------|-------------|
| Free     | 3            | 1             | 4           |
| Medium   | 10           | 5             | 15          |
| Pro      | Unlimited    | Unlimited     | Unlimited   |

