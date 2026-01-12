import { describe, expect, it } from "vitest";
import { z } from "zod";

import { updateTagSchema } from "./update-tag.schema";

const VALID_TAG_ID = "tag_abcdefghijklmnopqrstuv";

describe("updateTagSchema", () => {
  it("should validate a valid tag update", () => {
    const data = {
      id: VALID_TAG_ID,
      name: "Updated Tag",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when id is missing", () => {
    const data = {
      name: "Updated Tag",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when name is missing", () => {
    const data = {
      id: VALID_TAG_ID,
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when id has wrong prefix", () => {
    const data = {
      id: "deck_abcdefghijklmnopqrstuv",
      name: "Updated Tag",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.id?.errors).toContain("ID passed is not a tag ID.");
    }
  });

  it("should fail when id has wrong length", () => {
    const data = {
      id: "tag_short",
      name: "Updated Tag",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.id?.errors).toContain("Wrong ID size.");
    }
  });

  it("should fail when name is empty", () => {
    const data = {
      id: VALID_TAG_ID,
      name: "",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when name exceeds 30 characters", () => {
    const data = {
      id: VALID_TAG_ID,
      name: "a".repeat(31),
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when name contains comma", () => {
    const data = {
      id: VALID_TAG_ID,
      name: "tag,name",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.name?.errors).toContain(
        `Tag name can't include comma "," character.`,
      );
    }
  });

  it("should trim whitespace from name", () => {
    const data = {
      id: VALID_TAG_ID,
      name: "  Updated Tag  ",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Tag");
    }
  });

  it("should trim whitespace from id", () => {
    const data = {
      id: `  ${VALID_TAG_ID}  `,
      name: "Updated Tag",
    };

    const result = updateTagSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(VALID_TAG_ID);
    }
  });
});
