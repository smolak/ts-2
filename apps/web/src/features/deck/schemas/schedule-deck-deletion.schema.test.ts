import { describe, expect, it } from "vitest";
import { z } from "zod";

import { scheduleDeckDeletionSchema } from "./schedule-deck-deletion.schema";

const VALID_DECK_ID = "deck_abcdefghijklmnopqrstuv";

describe("scheduleDeckDeletionSchema", () => {
  it("should validate a valid deck ID", () => {
    const data = {
      deckId: VALID_DECK_ID,
    };

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when deckId is missing", () => {
    const data = {};

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when deckId has wrong prefix", () => {
    const data = {
      deckId: "user_abcdefghijklmnopqrstuv",
    };

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.deckId?.errors).toContain("ID passed is not a deck ID.");
    }
  });

  it("should fail when deckId has wrong length", () => {
    const data = {
      deckId: "deck_abc",
    };

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.deckId?.errors).toContain("Wrong ID size.");
    }
  });

  it("should fail when deckId is empty string", () => {
    const data = {
      deckId: "",
    };

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should trim deckId whitespace", () => {
    const data = {
      deckId: `  ${VALID_DECK_ID}  `,
    };

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deckId).toBe(VALID_DECK_ID);
    }
  });

  it("should fail when deckId is too long", () => {
    const data = {
      deckId: "deck_abcdefghijklmnopqrstuvwxyz123456",
    };

    const result = scheduleDeckDeletionSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.deckId?.errors).toContain("Wrong ID size.");
    }
  });
});
