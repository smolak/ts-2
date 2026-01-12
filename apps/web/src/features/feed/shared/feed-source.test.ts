import { describe, expect, it } from "vitest";

import { DEFAULT_FEED_SOURCE, feedSourceSchema, feedSources } from "./feed-source";

describe("feedSources", () => {
  it("should have 'All' as first option with value 'default'", () => {
    expect(feedSources[0]).toEqual({ label: "All", value: "default" });
  });

  it("should have 'Author' as second option with value 'author'", () => {
    expect(feedSources[1]).toEqual({ label: "Author", value: "author" });
  });

  it("should have exactly 2 feed sources", () => {
    expect(feedSources).toHaveLength(2);
  });
});

describe("DEFAULT_FEED_SOURCE", () => {
  it("should be 'default'", () => {
    expect(DEFAULT_FEED_SOURCE).toBe("default");
  });
});

describe("feedSourceSchema", () => {
  it("should validate 'default' as a valid feed source", () => {
    const result = feedSourceSchema.safeParse("default");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("default");
    }
  });

  it("should validate 'author' as a valid feed source", () => {
    const result = feedSourceSchema.safeParse("author");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("author");
    }
  });

  it("should fallback to default for invalid feed source", () => {
    const result = feedSourceSchema.safeParse("invalid");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(DEFAULT_FEED_SOURCE);
    }
  });

  it("should fallback to default for empty string", () => {
    const result = feedSourceSchema.safeParse("");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(DEFAULT_FEED_SOURCE);
    }
  });

  it("should fallback to default for null", () => {
    const result = feedSourceSchema.safeParse(null);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(DEFAULT_FEED_SOURCE);
    }
  });

  it("should fallback to default for undefined", () => {
    const result = feedSourceSchema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(DEFAULT_FEED_SOURCE);
    }
  });

  it("should fallback to default for number", () => {
    const result = feedSourceSchema.safeParse(123);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(DEFAULT_FEED_SOURCE);
    }
  });
});
