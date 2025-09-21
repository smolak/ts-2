import { generateCategoryId } from "@repo/db/id/category-id";
import { describe, expect, it } from "vitest";
import { getCategoryIdsFromSearchQuery } from "./get-category-ids-from-search-query";

describe("getCategoryIdsFromSearchQuery", () => {
  describe("when input is undefined or null", () => {
    it("should return empty array when input is undefined", () => {
      const input = undefined;

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([]);
    });

    it("should return empty array when input is null", () => {
      const input = null as unknown as string;

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([]);
    });
  });

  describe("when input is an empty string", () => {
    it("should return empty array for empty string", () => {
      const input = "";

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([]);
    });

    it("should return empty array for whitespace-only string", () => {
      const input = "   ";

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([]);
    });
  });

  describe("when input is an array", () => {
    it("should return empty array for empty array", () => {
      const input: string[] = [];

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([]);
    });

    it("should filter out invalid category IDs from array", () => {
      const validId1 = generateCategoryId();
      const validId2 = generateCategoryId();
      const invalidId1 = "invalid_id";
      const invalidId2 = "cat_short";

      const result = getCategoryIdsFromSearchQuery([validId1, invalidId1, validId2, invalidId2]);

      expect(result).toEqual([validId1, validId2]);
    });

    it("should return empty array when all IDs are invalid", () => {
      const invalidIds = ["invalid_id", "cat_short", "wrong_prefix_1234567890123456789012"];

      const result = getCategoryIdsFromSearchQuery(invalidIds);

      expect(result).toEqual([]);
    });

    it("should handle array with only valid IDs", () => {
      const validId1 = generateCategoryId();
      const validId2 = generateCategoryId();

      const result = getCategoryIdsFromSearchQuery([validId1, validId2]);

      expect(result).toEqual([validId1, validId2]);
    });
  });

  describe("when input is a comma-separated string", () => {
    it("should parse comma-separated valid category IDs", () => {
      const validId1 = generateCategoryId();
      const validId2 = generateCategoryId();
      const input = `${validId1},${validId2}`;

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([validId1, validId2]);
    });

    it("should handle whitespace around commas", () => {
      const validId1 = generateCategoryId();
      const validId2 = generateCategoryId();
      const input = ` ${validId1} , ${validId2} `;

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([validId1, validId2]);
    });

    it("should filter out invalid IDs from comma-separated string", () => {
      const validId = generateCategoryId();
      const invalidId1 = "invalid_id";
      const invalidId2 = "cat_short";
      const input = `${validId},${invalidId1},${invalidId2}`;

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([validId]);
    });

    it("should return empty array when all IDs in string are invalid", () => {
      const invalidIds = "invalid_id,cat_short,wrong_prefix_1234567890123456789012";

      const result = getCategoryIdsFromSearchQuery(invalidIds);

      expect(result).toEqual([]);
    });

    it("should handle string with only commas and whitespace", () => {
      const input = " , , ";

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([]);
    });

    it("should handle single valid ID", () => {
      const validId = generateCategoryId();

      const result = getCategoryIdsFromSearchQuery(validId);

      expect(result).toEqual([validId]);
    });

    it("should handle single invalid ID", () => {
      const invalidId = "invalid_id";

      const result = getCategoryIdsFromSearchQuery(invalidId);

      expect(result).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle mixed valid and invalid IDs with various formats", () => {
      const validId = generateCategoryId();
      const invalidIds = [
        "cat_short", // too short
        "wrong_1234567890123456789012", // wrong prefix
        "cat_12345678901234567890123", // too long
        "CAT_1234567890123456789012", // wrong case
        "", // empty
        "cat_", // just prefix
      ];
      const input = [validId, ...invalidIds].join(",");

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([validId]);
    });

    it("should preserve order of valid IDs", () => {
      const validId1 = generateCategoryId();
      const validId2 = generateCategoryId();
      const validId3 = generateCategoryId();
      const input = `${validId1},invalid,${validId2},also_invalid,${validId3}`;

      const result = getCategoryIdsFromSearchQuery(input);

      expect(result).toEqual([validId1, validId2, validId3]);
    });
  });
});
