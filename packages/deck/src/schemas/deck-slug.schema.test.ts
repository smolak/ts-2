import { describe, expect, it } from "vitest";
import { DECK_SLUG_MAX_LENGTH, deckSlugSchema } from "./deck-slug.schema";

describe("deckSlugSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid slugs", () => {
      const validSlugs = [
        "free-games",
        "personal",
        "movies-to-watch",
        "a",
        "a".repeat(DECK_SLUG_MAX_LENGTH),
        "deck-name",
        "deck123",
        "my-awesome-collection",
        "123",
        "abc123def",
      ];

      validSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).not.toThrow();
        expect(deckSlugSchema.parse(slug)).toBe(slug);
      });
    });

    it("should trim whitespace from valid inputs", () => {
      const inputs = ["  free-games  ", "\tpersonal\t", "\nmovies\n"];

      inputs.forEach((input) => {
        const result = deckSlugSchema.parse(input);

        expect(result).toBe(input.trim());
      });
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty strings", () => {
      const emptyInputs = ["", "   ", "\t", "\n", "\r\n"];

      emptyInputs.forEach((input) => {
        expect(() => deckSlugSchema.parse(input)).toThrow();
      });
    });

    it("should reject strings that are too long", () => {
      const tooLongSlug = "a".repeat(DECK_SLUG_MAX_LENGTH + 1);

      expect(() => deckSlugSchema.parse(tooLongSlug)).toThrow();
    });

    it("should reject uppercase letters", () => {
      const invalidSlugs = ["Free-Games", "PERSONAL", "MyDeck", "freeGames"];

      invalidSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });

    it("should reject special characters other than hyphens", () => {
      const invalidSlugs = [
        "free_games",
        "free.games",
        "free games",
        "free@games",
        "free!games",
        "free#games",
        "free$games",
      ];

      invalidSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });

    it("should reject slugs starting with hyphen", () => {
      const invalidSlugs = ["-free-games", "-personal", "-123"];

      invalidSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });

    it("should reject slugs ending with hyphen", () => {
      const invalidSlugs = ["free-games-", "personal-", "123-"];

      invalidSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });

    it("should reject slugs with consecutive hyphens", () => {
      const invalidSlugs = ["free--games", "my---deck", "a--b", "test----slug"];

      invalidSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });

    it("should reject non-string inputs", () => {
      const nonStringInputs = [null, undefined, 123, true, false, {}, [], () => {}];

      nonStringInputs.forEach((input) => {
        expect(() => deckSlugSchema.parse(input)).toThrow();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle exactly maximum length", () => {
      const maxLengthSlug = "a".repeat(DECK_SLUG_MAX_LENGTH);

      expect(() => deckSlugSchema.parse(maxLengthSlug)).not.toThrow();
      expect(deckSlugSchema.parse(maxLengthSlug)).toBe(maxLengthSlug);
    });

    it("should handle minimum length", () => {
      const minLengthSlug = "a";

      expect(() => deckSlugSchema.parse(minLengthSlug)).not.toThrow();
      expect(deckSlugSchema.parse(minLengthSlug)).toBe(minLengthSlug);
    });

    it("should handle single hyphen in middle", () => {
      const slug = "a-b";

      expect(() => deckSlugSchema.parse(slug)).not.toThrow();
      expect(deckSlugSchema.parse(slug)).toBe(slug);
    });

    it("should handle numbers only", () => {
      const slug = "123456";

      expect(() => deckSlugSchema.parse(slug)).not.toThrow();
      expect(deckSlugSchema.parse(slug)).toBe(slug);
    });

    it("should reject unicode characters", () => {
      const unicodeSlugs = ["café", "müller", "中文", "日本語"];

      unicodeSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });

    it("should reject emoji", () => {
      const emojiSlugs = ["🎮games", "movies🎬", "📚books"];

      emojiSlugs.forEach((slug) => {
        expect(() => deckSlugSchema.parse(slug)).toThrow();
      });
    });
  });
});
