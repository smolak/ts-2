import { describe, expect, it } from "vitest";
import { generateTagId, type TagId, tagIdSchema } from "./tag-id";

describe("tagIdSchema", () => {
  describe("valid tag IDs", () => {
    it("should validate a properly formatted tag ID", () => {
      const validId = "tag_abcdefghijkmnopqrstuvw";
      const result = tagIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validId);
      }
    });

    it("should validate a tag ID with mixed case characters", () => {
      const validId = "tag_AbCdEfGhIjKlMnOpQrStUv";
      const result = tagIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validId);
      }
    });

    it("should validate a tag ID with numbers", () => {
      const validId = "tag_1234567890123456789012";
      const result = tagIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validId);
      }
    });

    it("should trim whitespace from valid tag ID", () => {
      const validId = "  tag_abcdefghijkmnopqrstuvw  ";
      const result = tagIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("tag_abcdefghijkmnopqrstuvw");
      }
    });

    it("should validate a generated tag ID", () => {
      const generatedId = generateTagId();
      const result = tagIdSchema.safeParse(generatedId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(generatedId);
      }
    });
  });

  describe("invalid tag IDs", () => {
    it("should reject string without tag prefix", () => {
      const invalidId = "invalid_abcdefghijkmnopqrstuvw";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID passed is not a tag ID.");
      }
    });

    it("should reject string with wrong prefix", () => {
      const invalidId = "usr_abcdefghijkmnopqrstuvw";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID passed is not a tag ID.");
      }
    });

    it("should reject string that is too short", () => {
      const invalidId = "tag_short";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });

    it("should reject string that is too long", () => {
      const invalidId = "tag_abcdefghijkmnopqrstuvwxyz123456789";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });

    it("should reject empty string", () => {
      const invalidId = "";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID passed is not a tag ID.");
      }
    });

    it("should reject string with only prefix", () => {
      const invalidId = "tag_";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });

    it("should reject non-string input", () => {
      const invalidId = 123;
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject null input", () => {
      const invalidId = null;
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject undefined input", () => {
      const invalidId = undefined;
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject string with special characters", () => {
      const invalidId = "tag_abc!@#$%^&*()";
      const result = tagIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });
  });

  describe("type inference", () => {
    it("should correctly infer TagId type", () => {
      const validId = "tag_abcdefghijkmnopqrstuvw";
      const result = tagIdSchema.parse(validId);

      // This test ensures TypeScript type inference works correctly
      const tagId: TagId = result;
      expect(tagId).toBe(validId);
    });
  });
});

describe("generateTagId", () => {
  it("should prefix id with tag prefix", () => {
    const id = generateTagId();

    expect(id).toMatch(/^tag_[a-zA-Z0-9]{22}$/);
  });
});
