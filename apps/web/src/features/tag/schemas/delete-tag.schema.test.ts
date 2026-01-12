import { describe, expect, it } from "vitest";
import { z } from "zod";

import { deleteTagSchema } from "./delete-tag.schema";

const VALID_TAG_ID = "tag_abcdefghijklmnopqrstuv";

describe("deleteTagSchema", () => {
  it("should validate a valid tag ID", () => {
    const data = {
      id: VALID_TAG_ID,
    };

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when id is missing", () => {
    const data = {};

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when id has wrong prefix", () => {
    const data = {
      id: "deck_abcdefghijklmnopqrstuv",
    };

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.id?.errors).toContain("ID passed is not a tag ID.");
    }
  });

  it("should fail when id has wrong length", () => {
    const data = {
      id: "tag_abc",
    };

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.id?.errors).toContain("Wrong ID size.");
    }
  });

  it("should fail when id is empty string", () => {
    const data = {
      id: "",
    };

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should trim id whitespace", () => {
    const data = {
      id: `  ${VALID_TAG_ID}  `,
    };

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(VALID_TAG_ID);
    }
  });

  it("should fail when id is too long", () => {
    const data = {
      id: "tag_abcdefghijklmnopqrstuvwxyz",
    };

    const result = deleteTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.id?.errors).toContain("Wrong ID size.");
    }
  });
});
