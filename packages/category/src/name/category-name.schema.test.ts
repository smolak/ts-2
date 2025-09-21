import { describe, expect, it } from "vitest";
import { CATEGORY_NAME_MAX_LENGTH, categoryNameSchema } from "./category-name.schema";

describe("categoryNameSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid category names", () => {
      const validNames = [
        "Work",
        "Personal",
        "Shopping",
        "a", // minimum length
        "A".repeat(CATEGORY_NAME_MAX_LENGTH), // maximum length
        "Category-Name",
        "Category_Name",
        "Category Name",
        "Category123",
        "Category with spaces",
        "Category with numbers 123",
        "Special chars !@#$%^&*()",
      ];

      validNames.forEach((name) => {
        expect(() => categoryNameSchema.parse(name)).not.toThrow();
        expect(categoryNameSchema.parse(name)).toBe(name);
      });
    });

    it("should trim whitespace from valid inputs", () => {
      const inputs = ["  Work  ", "\tPersonal\t", "\nShopping\n", "  Category with spaces  "];

      inputs.forEach((input) => {
        const result = categoryNameSchema.parse(input);
        expect(result).toBe(input.trim());
      });
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty strings", () => {
      const emptyInputs = ["", "   ", "\t", "\n", "\r\n"];

      emptyInputs.forEach((input) => {
        expect(() => categoryNameSchema.parse(input)).toThrow();
      });
    });

    it("should reject strings that are too long", () => {
      const tooLongName = "A".repeat(CATEGORY_NAME_MAX_LENGTH + 1);

      expect(() => categoryNameSchema.parse(tooLongName)).toThrow();
    });

    it("should reject strings containing commas", () => {
      const invalidNames = [
        "Work, Personal",
        "Category, Name",
        "Shopping, Groceries",
        "Category with, comma",
        "Category,Name,Multiple",
        ",Category",
        "Category,",
        "Category, Name, Multiple",
      ];

      invalidNames.forEach((name) => {
        expect(() => categoryNameSchema.parse(name)).toThrow();
      });
    });

    it("should reject non-string inputs", () => {
      const nonStringInputs = [null, undefined, 123, true, false, {}, [], () => {}];

      nonStringInputs.forEach((input) => {
        expect(() => categoryNameSchema.parse(input)).toThrow();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle exactly maximum length", () => {
      const maxLengthName = "A".repeat(CATEGORY_NAME_MAX_LENGTH);

      expect(() => categoryNameSchema.parse(maxLengthName)).not.toThrow();
      expect(categoryNameSchema.parse(maxLengthName)).toBe(maxLengthName);
    });

    it("should handle minimum length", () => {
      const minLengthName = "A";

      expect(() => categoryNameSchema.parse(minLengthName)).not.toThrow();
      expect(categoryNameSchema.parse(minLengthName)).toBe(minLengthName);
    });

    it("should handle strings with only special characters (no commas)", () => {
      const specialCharNames = ["!@#$%^&*()", "[]{}|\\:;\"'<>?/", "~`"];

      specialCharNames.forEach((name) => {
        expect(() => categoryNameSchema.parse(name)).not.toThrow();
        expect(categoryNameSchema.parse(name)).toBe(name);
      });
    });

    it("should handle unicode characters", () => {
      const unicodeNames = ["Café", "Müller", "中文", "日本語", "العربية", "Русский", "Ελληνικά"];

      unicodeNames.forEach((name) => {
        expect(() => categoryNameSchema.parse(name)).not.toThrow();
        expect(categoryNameSchema.parse(name)).toBe(name);
      });
    });
  });
});
