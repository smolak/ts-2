import { describe, expect, it } from "vitest";

import { generateSlug } from "./generate-slug";

describe("generateSlug", () => {
  it("should convert a simple name to lowercase slug", () => {
    const name = "My Deck";

    const result = generateSlug(name);

    expect(result).toBe("my-deck");
  });

  it("should handle multiple spaces between words", () => {
    const name = "My   Awesome   Deck";

    const result = generateSlug(name);

    expect(result).toBe("my-awesome-deck");
  });

  it("should remove special characters", () => {
    const name = "My @Deck! #With $pecial% Ch&rs*";

    const result = generateSlug(name);

    expect(result).toBe("my-deck-with-pecial-chrs");
  });

  it("should trim leading and trailing whitespace", () => {
    const name = "   My Deck   ";

    const result = generateSlug(name);

    expect(result).toBe("my-deck");
  });

  it("should remove leading and trailing hyphens", () => {
    const name = "---My Deck---";

    const result = generateSlug(name);

    expect(result).toBe("my-deck");
  });

  it("should collapse multiple consecutive hyphens into one", () => {
    const name = "My---Deck";

    const result = generateSlug(name);

    expect(result).toBe("my-deck");
  });

  it("should handle names with numbers", () => {
    const name = "My Deck 2024";

    const result = generateSlug(name);

    expect(result).toBe("my-deck-2024");
  });

  it("should handle empty string", () => {
    const name = "";

    const result = generateSlug(name);

    expect(result).toBe("");
  });

  it("should handle string with only special characters", () => {
    const name = "@#$%^&*()";

    const result = generateSlug(name);

    expect(result).toBe("");
  });

  it("should handle string with only spaces", () => {
    const name = "     ";

    const result = generateSlug(name);

    expect(result).toBe("");
  });

  it("should preserve existing hyphens in proper positions", () => {
    const name = "my-existing-deck";

    const result = generateSlug(name);

    expect(result).toBe("my-existing-deck");
  });

  it("should handle mixed case input", () => {
    const name = "MyAwesomeDECK";

    const result = generateSlug(name);

    expect(result).toBe("myawesomedeck");
  });

  it("should handle unicode characters by removing them", () => {
    const name = "My Émoji 🎉 Deck";

    const result = generateSlug(name);

    expect(result).toBe("my-moji-deck");
  });

  it("should handle accented characters", () => {
    const name = "Café Résumé";

    const result = generateSlug(name);

    expect(result).toBe("caf-rsum");
  });
});
