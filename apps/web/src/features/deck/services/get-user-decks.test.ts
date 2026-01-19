import { orm, schema } from "@repo/db/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestContext, createTestDeck, type TestContext } from "@/test-utils";

import { getUserDecks } from "./get-user-decks";

describe("getUserDecks service", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it("should return empty array when user has no decks", async () => {
    const result = await getUserDecks({
      db: ctx.db,
      userId: ctx.userId,
    });

    expect(result).toEqual([]);
  });

  it("should return user's decks", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Deck 1");
    await createTestDeck(ctx.db, ctx.userId, "Deck 2");

    const result = await getUserDecks({
      db: ctx.db,
      userId: ctx.userId,
    });

    expect(result).toHaveLength(2);
    expect(result.map((d) => d.name)).toContain("Deck 1");
    expect(result.map((d) => d.name)).toContain("Deck 2");
  });

  it("should not return decks from other users", async () => {
    await createTestDeck(ctx.db, ctx.userId, "My Deck");
    const otherUser = await ctx.createAdditionalUser();
    await createTestDeck(ctx.db, otherUser.userId, "Other User Deck");

    const result = await getUserDecks({
      db: ctx.db,
      userId: ctx.userId,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("My Deck");
  });

  it("should not return decks scheduled for deletion", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Active Deck");
    const pendingDeck = await createTestDeck(ctx.db, ctx.userId, "Pending Deck");
    await ctx.db
      .update(schema.decks)
      .set({ scheduledForDeletionAt: new Date() })
      .where(orm.eq(schema.decks.id, pendingDeck.id));

    const result = await getUserDecks({
      db: ctx.db,
      userId: ctx.userId,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Active Deck");
  });

  it("should order decks by name ascending", async () => {
    await createTestDeck(ctx.db, ctx.userId, "Cdeck");
    await createTestDeck(ctx.db, ctx.userId, "Bdeck");
    await createTestDeck(ctx.db, ctx.userId, "Adeck");

    const result = await getUserDecks({
      db: ctx.db,
      userId: ctx.userId,
    });

    expect(result).toHaveLength(3);
    expect(result[0]?.name).toBe("Adeck");
    expect(result[1]?.name).toBe("Bdeck");
    expect(result[2]?.name).toBe("Cdeck");
  });
});
