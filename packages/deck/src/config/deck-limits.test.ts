import { describe, expect, it } from "vitest";
import { canChangeDeckVisibility, canCreateDeck, DECK_LIMITS, getDeckLimits } from "./deck-limits";

describe("DECK_LIMITS", () => {
  it("should have correct limits for free plan", () => {
    expect(DECK_LIMITS.free).toEqual({
      maxPublicDecks: 3,
      maxPrivateDecks: 1,
      maxTotalDecks: 4,
    });
  });

  it("should have correct limits for medium plan", () => {
    expect(DECK_LIMITS.medium).toEqual({
      maxPublicDecks: 10,
      maxPrivateDecks: 5,
      maxTotalDecks: 15,
    });
  });

  it("should have unlimited decks for pro plan", () => {
    expect(DECK_LIMITS.pro.maxPublicDecks).toBe(Number.POSITIVE_INFINITY);
    expect(DECK_LIMITS.pro.maxPrivateDecks).toBe(Number.POSITIVE_INFINITY);
    expect(DECK_LIMITS.pro.maxTotalDecks).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("getDeckLimits", () => {
  it("should return limits for free plan", () => {
    const limits = getDeckLimits("free");

    expect(limits).toEqual(DECK_LIMITS.free);
  });

  it("should return limits for medium plan", () => {
    const limits = getDeckLimits("medium");

    expect(limits).toEqual(DECK_LIMITS.medium);
  });

  it("should return limits for pro plan", () => {
    const limits = getDeckLimits("pro");

    expect(limits).toEqual(DECK_LIMITS.pro);
  });
});

describe("canCreateDeck", () => {
  describe("free plan", () => {
    const plan = "free" as const;

    it("should allow creating public deck when under public limit", () => {
      const result = canCreateDeck(plan, 0, 0, true);

      expect(result).toEqual({ allowed: true });
    });

    it("should allow creating private deck when under private limit", () => {
      const result = canCreateDeck(plan, 0, 0, false);

      expect(result).toEqual({ allowed: true });
    });

    it("should reject creating public deck when at public limit", () => {
      const result = canCreateDeck(plan, 3, 0, true);

      expect(result.allowed).toBe(false);
      expect(result).toHaveProperty("reason");
      expect((result as { reason: string }).reason).toContain("3 public decks");
      expect((result as { reason: string }).reason).toContain("free plan");
    });

    it("should reject creating private deck when at private limit", () => {
      const result = canCreateDeck(plan, 0, 1, false);

      expect(result.allowed).toBe(false);
      expect(result).toHaveProperty("reason");
      expect((result as { reason: string }).reason).toContain("1 private decks");
      expect((result as { reason: string }).reason).toContain("free plan");
    });

    it("should reject creating any deck when at total limit", () => {
      const result = canCreateDeck(plan, 3, 1, true);

      expect(result.allowed).toBe(false);
      expect(result).toHaveProperty("reason");
      expect((result as { reason: string }).reason).toContain("4 decks");
    });

    it("should still allow private deck when at public limit but under total", () => {
      const result = canCreateDeck(plan, 3, 0, false);

      expect(result).toEqual({ allowed: true });
    });

    it("should still allow public deck when at private limit but under total", () => {
      const result = canCreateDeck(plan, 2, 1, true);

      expect(result).toEqual({ allowed: true });
    });
  });

  describe("medium plan", () => {
    const plan = "medium" as const;

    it("should allow creating public deck when under public limit", () => {
      const result = canCreateDeck(plan, 5, 2, true);

      expect(result).toEqual({ allowed: true });
    });

    it("should reject creating public deck when at public limit", () => {
      const result = canCreateDeck(plan, 10, 0, true);

      expect(result.allowed).toBe(false);
      expect((result as { reason: string }).reason).toContain("10 public decks");
    });

    it("should reject creating private deck when at private limit", () => {
      const result = canCreateDeck(plan, 0, 5, false);

      expect(result.allowed).toBe(false);
      expect((result as { reason: string }).reason).toContain("5 private decks");
    });

    it("should reject when at total limit", () => {
      const result = canCreateDeck(plan, 10, 5, true);

      expect(result.allowed).toBe(false);
      expect((result as { reason: string }).reason).toContain("15 decks");
    });
  });

  describe("pro plan", () => {
    const plan = "pro" as const;

    it("should allow creating public deck at any count", () => {
      const result = canCreateDeck(plan, 1000, 500, true);

      expect(result).toEqual({ allowed: true });
    });

    it("should allow creating private deck at any count", () => {
      const result = canCreateDeck(plan, 1000, 500, false);

      expect(result).toEqual({ allowed: true });
    });
  });
});

describe("canChangeDeckVisibility", () => {
  describe("free plan", () => {
    const plan = "free" as const;

    it("should allow when visibility is not changing", () => {
      const result = canChangeDeckVisibility(plan, 3, 1, true, true);

      expect(result).toEqual({ allowed: true });
    });

    it("should allow private to public when under public limit", () => {
      const result = canChangeDeckVisibility(plan, 2, 1, false, true);

      expect(result).toEqual({ allowed: true });
    });

    it("should reject private to public when at public limit", () => {
      const result = canChangeDeckVisibility(plan, 3, 1, false, true);

      expect(result.allowed).toBe(false);
      expect((result as { reason: string }).reason).toContain("3 public decks");
    });

    it("should allow public to private when under private limit", () => {
      const result = canChangeDeckVisibility(plan, 3, 0, true, false);

      expect(result).toEqual({ allowed: true });
    });

    it("should reject public to private when at private limit", () => {
      const result = canChangeDeckVisibility(plan, 3, 1, true, false);

      expect(result.allowed).toBe(false);
      expect((result as { reason: string }).reason).toContain("1 private decks");
    });
  });

  describe("pro plan", () => {
    const plan = "pro" as const;

    it("should allow any visibility change", () => {
      const result1 = canChangeDeckVisibility(plan, 1000, 500, true, false);
      const result2 = canChangeDeckVisibility(plan, 1000, 500, false, true);

      expect(result1).toEqual({ allowed: true });
      expect(result2).toEqual({ allowed: true });
    });
  });
});
