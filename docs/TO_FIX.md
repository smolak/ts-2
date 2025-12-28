# Fixes Backlog

This file tracks technical fixes and bugs that need to be addressed, separate from feature development tracked in PLAN.md.

---

## Cursor Pagination Bug in User Feed

> **Status**: Pending
> **Identified**: December 21, 2025
> **Severity**: Low (edge case)

### Problem

The `get-user-feed.ts` procedure uses an incorrect approach for cursor-based pagination:

```typescript
if (feedRawEntries.length === itemsPerFetch && feedRawEntries.length > 0) {
  nextCursor = feedRawEntries[feedRawEntries.length - 1]?.feed_createdAt;
}
```

This assumes that if exactly `itemsPerFetch` items are returned, there are more items. However, this fails when the total count is an exact multiple of `itemsPerFetch` (e.g., exactly 10, 20, 30 items) — it will incorrectly provide a `nextCursor` that returns 0 results.

### Affected Files

- `apps/web/src/features/feed/queries/get-user-feed.ts` (line 126: `query.limit(limit)`)
- `apps/web/src/features/feed/router/procedures/get-user-feed.ts` (lines 55-57)

### Correct Pattern

See `apps/web/src/features/deck/router/procedures/get-deck-urls.ts` for reference:

1. Fetch `limit + 1` items
2. Check `hasMore = results.length > limit`
3. Return only `limit` items via `.slice(0, limit)`
4. Provide `nextCursor` only when `hasMore` is true

### Fix Required

1. Update `get-user-feed.ts` query to use `limit + 1`
2. Update procedure to check `length > itemsPerFetch` instead of `length === itemsPerFetch`

