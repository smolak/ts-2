import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createDeckSchema } from "./create-deck.schema";

describe("createDeckSchema", () => {
  it("should validate a valid deck with required fields", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate a valid deck with optional metadata", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: false,
      metadata: {
        description: "A great deck",
        color: "#FF5733",
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when name is empty", () => {
    const data = {
      name: "",
      slug: "my-deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.name?.errors).toContain("Deck name is required.");
    }
  });

  it("should fail when name exceeds 50 characters", () => {
    const data = {
      name: "a".repeat(51),
      slug: "my-deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.name?.errors).toContain("Deck name cannot exceed 50 characters.");
    }
  });

  it("should trim whitespace from name", () => {
    const data = {
      name: "  My Deck  ",
      slug: "my-deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Deck");
    }
  });

  it("should fail when slug is empty", () => {
    const data = {
      name: "My Deck",
      slug: "",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain("Deck slug is required.");
    }
  });

  it("should fail when slug exceeds 50 characters", () => {
    const data = {
      name: "My Deck",
      slug: "a".repeat(51),
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain("Slug cannot exceed 50 characters.");
    }
  });

  it("should fail when slug contains uppercase letters", () => {
    const data = {
      name: "My Deck",
      slug: "My-Deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain(
        "Slug can only contain lowercase letters, numbers, and hyphens.",
      );
    }
  });

  it("should fail when slug contains special characters", () => {
    const data = {
      name: "My Deck",
      slug: "my_deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain(
        "Slug can only contain lowercase letters, numbers, and hyphens.",
      );
    }
  });

  it("should fail when slug starts with hyphen", () => {
    const data = {
      name: "My Deck",
      slug: "-my-deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain(
        "Slug cannot start or end with a hyphen.",
      );
    }
  });

  it("should fail when slug ends with hyphen", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck-",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain(
        "Slug cannot start or end with a hyphen.",
      );
    }
  });

  it("should fail when slug contains consecutive hyphens", () => {
    const data = {
      name: "My Deck",
      slug: "my--deck",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.slug?.errors).toContain(
        "Slug cannot contain consecutive hyphens.",
      );
    }
  });

  it("should validate slug with numbers", () => {
    const data = {
      name: "My Deck 2024",
      slug: "my-deck-2024",
      isPublic: true,
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when isPublic is missing", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when isPublic is not a boolean", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: "true",
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should validate metadata with valid description", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        description: "A valid description",
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when metadata description exceeds 500 characters", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        description: "a".repeat(501),
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should validate metadata with valid hex color", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        color: "#FF5733",
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when metadata color is invalid hex", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        color: "red",
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should validate metadata with valid image URL", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        imageUrl: "https://example.com/image.png",
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when metadata imageUrl is invalid", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        imageUrl: "not-a-url",
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should allow null values for optional metadata fields", () => {
    const data = {
      name: "My Deck",
      slug: "my-deck",
      isPublic: true,
      metadata: {
        description: null,
        imageUrl: null,
        color: null,
      },
    };

    const result = createDeckSchema.safeParse(data);

    expect(result.success).toBe(true);
  });
});
