import { describe, expect, it } from "vitest";
import { generateDeckId } from "./deck-id";

describe("generateDeckId", () => {
  it("should prefix id with deck prefix", () => {
    const id = generateDeckId();

    expect(id).toMatch(/^deck_[a-zA-Z0-9]{22}$/);
  });
});
