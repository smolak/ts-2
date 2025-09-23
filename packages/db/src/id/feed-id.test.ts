import { describe, expect, it } from "vitest";
import { generateFeedId } from "./feed-id";

describe("generateFeedId", () => {
  it("should prefix id with feed prefix", () => {
    const id = generateFeedId();

    expect(id).toMatch(/^feed_[a-zA-Z0-9]{22}$/);
  });
});
