import { describe, expect, it } from "vitest";
import { DECK_NAME_MAX_LENGTH, deckNameSchema } from "./deck-name.schema";

describe("deckNameSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid deck names", () => {
      const validNames = [
        "Free Games",
        "Personal",
        "Movies to Watch",
        "a",
        "A".repeat(DECK_NAME_MAX_LENGTH),
        "Deck-Name",
        "Deck_Name",
        "Deck123",
        "My Awesome Collection",
        "Special chars !@#$%^&*()",
      ];

      validNames.forEach((name) => {
        expect(() => deckNameSchema.parse(name)).not.toThrow();
        expect(deckNameSchema.parse(name)).toBe(name);
      });
    });

    it("should trim whitespace from valid inputs", () => {
      const inputs = ["  Free Games  ", "\tPersonal\t", "\nMovies\n", "  Deck with spaces  "];

      inputs.forEach((input) => {
        const result = deckNameSchema.parse(input);

        expect(result).toBe(input.trim());
      });
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty strings", () => {
      const emptyInputs = ["", "   ", "\t", "\n", "\r\n"];

      emptyInputs.forEach((input) => {
        expect(() => deckNameSchema.parse(input)).toThrow();
      });
    });

    it("should reject strings that are too long", () => {
      const tooLongName = "A".repeat(DECK_NAME_MAX_LENGTH + 1);

      expect(() => deckNameSchema.parse(tooLongName)).toThrow();
    });

    it("should reject non-string inputs", () => {
      const nonStringInputs = [null, undefined, 123, true, false, {}, [], () => {}];

      nonStringInputs.forEach((input) => {
        expect(() => deckNameSchema.parse(input)).toThrow();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle exactly maximum length", () => {
      const maxLengthName = "A".repeat(DECK_NAME_MAX_LENGTH);

      expect(() => deckNameSchema.parse(maxLengthName)).not.toThrow();
      expect(deckNameSchema.parse(maxLengthName)).toBe(maxLengthName);
    });

    it("should handle minimum length", () => {
      const minLengthName = "A";

      expect(() => deckNameSchema.parse(minLengthName)).not.toThrow();
      expect(deckNameSchema.parse(minLengthName)).toBe(minLengthName);
    });

    it("should handle unicode characters", () => {
      const unicodeNames = ["Café", "Müller", "中文", "日本語", "العربية", "Русский", "Ελληνικά"];

      unicodeNames.forEach((name) => {
        expect(() => deckNameSchema.parse(name)).not.toThrow();
        expect(deckNameSchema.parse(name)).toBe(name);
      });
    });

    it("should handle emoji in deck names", () => {
      const emojiNames = ["🎮 Games", "Movies 🎬", "📚 Books"];

      emojiNames.forEach((name) => {
        expect(() => deckNameSchema.parse(name)).not.toThrow();
        expect(deckNameSchema.parse(name)).toBe(name);
      });
    });
  });
});

