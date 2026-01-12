import { describe, expect, it } from "vitest";
import { z } from "zod";

import { updateDeckSchema } from "./update-deck.schema";

const VALID_DECK_ID = "deck_abcdefghijklmnopqrstuv";

describe("updateDeckSchema", () => {
  it("should validate with only deckId (all other fields optional)", () => {
    const data = {
      deckId: VALID_DECK_ID,
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate with deckId and name", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "Updated Deck Name",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate with deckId and slug", () => {
    const data = {
      deckId: VALID_DECK_ID,
      slug: "updated-slug",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate with deckId and isPublic", () => {
    const data = {
      deckId: VALID_DECK_ID,
      isPublic: false,
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate with deckId and metadata", () => {
    const data = {
      deckId: VALID_DECK_ID,
      metadata: {
        description: "Updated description",
        color: "#123456",
      },
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate with all fields provided", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "Updated Deck",
      slug: "updated-deck",
      isPublic: true,
      metadata: {
        description: "Full update",
        imageUrl: "https://example.com/image.png",
        color: "#AABBCC",
      },
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when deckId is missing", () => {
    const data = {
      name: "Updated Name",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when deckId has wrong prefix", () => {
    const data = {
      deckId: "tag_abcdefghijklmnopqrstuv",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.deckId?.errors).toContain("ID passed is not a deck ID.");
    }
  });

  it("should fail when deckId has wrong length", () => {
    const data = {
      deckId: "deck_tooshort",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.deckId?.errors).toContain("Wrong ID size.");
    }
  });

  it("should fail when optional name is empty string", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.name?.errors).toContain("Deck name is required.");
    }
  });

  it("should fail when optional name exceeds 50 characters", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "a".repeat(51),
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when optional slug is invalid", () => {
    const data = {
      deckId: VALID_DECK_ID,
      slug: "Invalid-Slug",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when optional slug starts with hyphen", () => {
    const data = {
      deckId: VALID_DECK_ID,
      slug: "-invalid",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when optional slug contains consecutive hyphens", () => {
    const data = {
      deckId: VALID_DECK_ID,
      slug: "my--slug",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should trim deckId whitespace", () => {
    const data = {
      deckId: `  ${VALID_DECK_ID}  `,
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deckId).toBe(VALID_DECK_ID);
    }
  });

  it("should trim optional name whitespace", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "  Trimmed Name  ",
    };

    const result = updateDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Trimmed Name");
    }
  });
});
