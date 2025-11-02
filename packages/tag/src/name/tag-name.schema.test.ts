import { describe, expect, it } from "vitest";
import { TAG_NAME_MAX_LENGTH, tagNameSchema } from "./tag-name.schema";

describe("tagNameSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid tag names", () => {
      const validNames = [
        "Work",
        "Personal",
        "Shopping",
        "a", // minimum length
        "A".repeat(TAG_NAME_MAX_LENGTH), // maximum length
        "Tag-Name",
        "Tag_Name",
        "Tag Name",
        "Tag123",
        "Tag with spaces",
        "Tag with numbers 123",
        "Special chars !@#$%^&*()",
      ];

      validNames.forEach((name) => {
        expect(() => tagNameSchema.parse(name)).not.toThrow();
        expect(tagNameSchema.parse(name)).toBe(name);
      });
    });

    it("should trim whitespace from valid inputs", () => {
      const inputs = ["  Work  ", "\tPersonal\t", "\nShopping\n", "  Tag with spaces  "];

      inputs.forEach((input) => {
        const result = tagNameSchema.parse(input);
        expect(result).toBe(input.trim());
      });
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty strings", () => {
      const emptyInputs = ["", "   ", "\t", "\n", "\r\n"];

      emptyInputs.forEach((input) => {
        expect(() => tagNameSchema.parse(input)).toThrow();
      });
    });

    it("should reject strings that are too long", () => {
      const tooLongName = "A".repeat(TAG_NAME_MAX_LENGTH + 1);

      expect(() => tagNameSchema.parse(tooLongName)).toThrow();
    });

    it("should reject strings containing commas", () => {
      const invalidNames = [
        "Work, Personal",
        "Tag, Name",
        "Shopping, Groceries",
        "Tag with, comma",
        "Tag,Name,Multiple",
        ",Tag",
        "Tag,",
        "Tag, Name, Multiple",
      ];

      invalidNames.forEach((name) => {
        expect(() => tagNameSchema.parse(name)).toThrow();
      });
    });

    it("should reject non-string inputs", () => {
      const nonStringInputs = [null, undefined, 123, true, false, {}, [], () => {}];

      nonStringInputs.forEach((input) => {
        expect(() => tagNameSchema.parse(input)).toThrow();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle exactly maximum length", () => {
      const maxLengthName = "A".repeat(TAG_NAME_MAX_LENGTH);

      expect(() => tagNameSchema.parse(maxLengthName)).not.toThrow();
      expect(tagNameSchema.parse(maxLengthName)).toBe(maxLengthName);
    });

    it("should handle minimum length", () => {
      const minLengthName = "A";

      expect(() => tagNameSchema.parse(minLengthName)).not.toThrow();
      expect(tagNameSchema.parse(minLengthName)).toBe(minLengthName);
    });

    it("should handle strings with only special characters (no commas)", () => {
      const specialCharNames = ["!@#$%^&*()", "[]{}|\\:;\"'<>?/", "~`"];

      specialCharNames.forEach((name) => {
        expect(() => tagNameSchema.parse(name)).not.toThrow();
        expect(tagNameSchema.parse(name)).toBe(name);
      });
    });

    it("should handle unicode characters", () => {
      const unicodeNames = ["Café", "Müller", "中文", "日本語", "العربية", "Русский", "Ελληνικά"];

      unicodeNames.forEach((name) => {
        expect(() => tagNameSchema.parse(name)).not.toThrow();
        expect(tagNameSchema.parse(name)).toBe(name);
      });
    });
  });
});
