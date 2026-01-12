import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createTagSchema } from "./create-tag.schema";

const VALID_DECK_ID = "deck_abcdefghijklmnopqrstuv";

describe("createTagSchema", () => {
  it("should validate a valid tag with deckId and name", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "My Tag",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when deckId is missing", () => {
    const data = {
      name: "My Tag",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when name is missing", () => {
    const data = {
      deckId: VALID_DECK_ID,
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when deckId has wrong prefix", () => {
    const data = {
      deckId: "tag_abcdefghijklmnopqrstuv",
      name: "My Tag",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.deckId?.errors).toContain("ID passed is not a deck ID.");
    }
  });

  it("should fail when name is empty", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when name exceeds 30 characters", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "a".repeat(31),
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when name contains comma", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "tag,with,commas",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.name?.errors).toContain(
        `Tag name can't include comma "," character.`,
      );
    }
  });

  it("should trim whitespace from name", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "  My Tag  ",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Tag");
    }
  });

  it("should validate name at max length (30 chars)", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "a".repeat(30),
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should allow special characters except comma", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "tag-with_special!@#$%",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should allow spaces in name", () => {
    const data = {
      deckId: VALID_DECK_ID,
      name: "my awesome tag",
    };

    const result = createTagSchema.safeParse(data);

    expect(result.success).toBe(true);
  });
});
