import { describe, expect, it } from "vitest";
import { DECK_DESCRIPTION_MAX_LENGTH, deckMetadataSchema } from "./deck-metadata.schema";

describe("deckMetadataSchema", () => {
  describe("valid inputs", () => {
    it("should accept complete valid metadata", () => {
      const validMetadata = {
        description: "A collection of free games",
        imageUrl: "https://example.com/image.png",
        color: "#FF5733",
      };

      const result = deckMetadataSchema.parse(validMetadata);

      expect(result).toEqual(validMetadata);
    });

    it("should accept empty object", () => {
      const result = deckMetadataSchema.parse({});

      expect(result).toEqual({});
    });

    it("should accept partial metadata", () => {
      const partialMetadata = { description: "Just a description" };

      const result = deckMetadataSchema.parse(partialMetadata);

      expect(result).toEqual(partialMetadata);
    });

    it("should accept null values for optional fields", () => {
      const metadataWithNulls = {
        description: null,
        imageUrl: null,
        color: null,
      };

      const result = deckMetadataSchema.parse(metadataWithNulls);

      expect(result).toEqual(metadataWithNulls);
    });

    it("should accept undefined values for optional fields", () => {
      const metadataWithUndefined = {
        description: undefined,
        imageUrl: undefined,
        color: undefined,
      };

      const result = deckMetadataSchema.parse(metadataWithUndefined);

      expect(result).toEqual({});
    });
  });

  describe("description field", () => {
    it("should accept valid descriptions", () => {
      const validDescriptions = [
        "A short description",
        "A".repeat(DECK_DESCRIPTION_MAX_LENGTH),
        "Description with unicode: Café, 日本語, العربية",
        "Description with emoji: 🎮📚🎬",
        "Description with\nnewlines",
      ];

      validDescriptions.forEach((description) => {
        const result = deckMetadataSchema.parse({ description });

        expect(result.description).toBe(description.trim());
      });
    });

    it("should trim whitespace from description", () => {
      const result = deckMetadataSchema.parse({ description: "  trimmed  " });

      expect(result.description).toBe("trimmed");
    });

    it("should reject descriptions that are too long", () => {
      const tooLongDescription = "A".repeat(DECK_DESCRIPTION_MAX_LENGTH + 1);

      expect(() => deckMetadataSchema.parse({ description: tooLongDescription })).toThrow();
    });

    it("should accept empty string as description", () => {
      const result = deckMetadataSchema.parse({ description: "" });

      expect(result.description).toBe("");
    });
  });

  describe("imageUrl field", () => {
    it("should accept valid URLs", () => {
      const validUrls = [
        "https://example.com/image.png",
        "http://example.com/image.jpg",
        "https://cdn.example.com/path/to/image.webp",
        "https://example.com/image?query=param",
        "https://example.com/image#hash",
      ];

      validUrls.forEach((imageUrl) => {
        const result = deckMetadataSchema.parse({ imageUrl });

        expect(result.imageUrl).toBe(imageUrl);
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = ["not-a-url", "example.com/image.png", "/path/to/image.png", ""];

      invalidUrls.forEach((imageUrl) => {
        expect(() => deckMetadataSchema.parse({ imageUrl })).toThrow();
      });
    });
  });

  describe("color field", () => {
    it("should accept valid hex colors", () => {
      const validColors = ["#FF5733", "#000000", "#FFFFFF", "#abcdef", "#ABCDEF", "#123456", "#ff5733"];

      validColors.forEach((color) => {
        const result = deckMetadataSchema.parse({ color });

        expect(result.color).toBe(color);
      });
    });

    it("should reject invalid hex colors", () => {
      const invalidColors = [
        "FF5733",
        "#FFF",
        "#FFFFFFF",
        "#GGGGGG",
        "rgb(255, 87, 51)",
        "red",
        "#FF573",
        "#FF57333",
      ];

      invalidColors.forEach((color) => {
        expect(() => deckMetadataSchema.parse({ color })).toThrow();
      });
    });

    it("should trim whitespace from color", () => {
      const result = deckMetadataSchema.parse({ color: "  #FF5733  " });

      expect(result.color).toBe("#FF5733");
    });
  });

  describe("edge cases", () => {
    it("should ignore extra fields", () => {
      const metadataWithExtra = {
        description: "Valid description",
        extraField: "should be ignored",
      };

      const result = deckMetadataSchema.parse(metadataWithExtra);

      expect(result).toEqual({ description: "Valid description" });
      expect(result).not.toHaveProperty("extraField");
    });

    it("should handle maximum length description exactly", () => {
      const maxDescription = "A".repeat(DECK_DESCRIPTION_MAX_LENGTH);

      const result = deckMetadataSchema.parse({ description: maxDescription });

      expect(result.description).toBe(maxDescription);
      expect(result.description?.length).toBe(DECK_DESCRIPTION_MAX_LENGTH);
    });
  });
});

