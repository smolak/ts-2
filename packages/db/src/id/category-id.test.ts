import { describe, expect, it } from "vitest";
import { type CategoryId, categoryIdSchema, generateCategoryId } from "./category-id";

describe("categoryIdSchema", () => {
  describe("valid category IDs", () => {
    it("should validate a properly formatted category ID", () => {
      const validId = "cat_abcdefghijkmnopqrstuvw";
      const result = categoryIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validId);
      }
    });

    it("should validate a category ID with mixed case characters", () => {
      const validId = "cat_AbCdEfGhIjKlMnOpQrStUv";
      const result = categoryIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validId);
      }
    });

    it("should validate a category ID with numbers", () => {
      const validId = "cat_1234567890123456789012";
      const result = categoryIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validId);
      }
    });

    it("should trim whitespace from valid category ID", () => {
      const validId = "  cat_abcdefghijkmnopqrstuvw  ";
      const result = categoryIdSchema.safeParse(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("cat_abcdefghijkmnopqrstuvw");
      }
    });

    it("should validate a generated category ID", () => {
      const generatedId = generateCategoryId();
      const result = categoryIdSchema.safeParse(generatedId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(generatedId);
      }
    });
  });

  describe("invalid category IDs", () => {
    it("should reject string without category prefix", () => {
      const invalidId = "invalid_abcdefghijkmnopqrstuvw";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID passed is not a category ID.");
      }
    });

    it("should reject string with wrong prefix", () => {
      const invalidId = "usr_abcdefghijkmnopqrstuvw";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID passed is not a category ID.");
      }
    });

    it("should reject string that is too short", () => {
      const invalidId = "cat_short";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });

    it("should reject string that is too long", () => {
      const invalidId = "cat_abcdefghijkmnopqrstuvwxyz123456789";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });

    it("should reject empty string", () => {
      const invalidId = "";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("ID passed is not a category ID.");
      }
    });

    it("should reject string with only prefix", () => {
      const invalidId = "cat_";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });

    it("should reject non-string input", () => {
      const invalidId = 123;
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject null input", () => {
      const invalidId = null;
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject undefined input", () => {
      const invalidId = undefined;
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject string with special characters", () => {
      const invalidId = "cat_abc!@#$%^&*()";
      const result = categoryIdSchema.safeParse(invalidId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Wrong ID size.");
      }
    });
  });

  describe("type inference", () => {
    it("should correctly infer CategoryId type", () => {
      const validId = "cat_abcdefghijkmnopqrstuvw";
      const result = categoryIdSchema.parse(validId);

      // This test ensures TypeScript type inference works correctly
      const categoryId: CategoryId = result;
      expect(categoryId).toBe(validId);
    });
  });
});

describe("generateCategoryId", () => {
  it("should prefix id with category prefix", () => {
    const id = generateCategoryId();

    expect(id).toMatch(/^cat_[a-zA-Z0-9]{22}$/);
  });
});
