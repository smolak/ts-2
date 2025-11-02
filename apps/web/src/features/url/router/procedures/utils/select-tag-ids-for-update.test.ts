import { describe, expect, it } from "vitest";
import { selectTagIdsForUpdate } from "./select-tag-ids-for-update";

describe("select-tag-ids-for-update", () => {
  describe("when none of the new tag IDs exist on the list of current Url tag IDs", () => {
    const currentTagIds = ["a", "b", "c"];
    const newTagIds = ["d", "e", "f"];

    it("should select all new Url tag IDs as those whose number of Urls is to be incremented", () => {
      const result = selectTagIdsForUpdate({ currentTagIds, newTagIds });

      expect(result.increment).toEqual(newTagIds);
    });

    it("should select all current tag IDs as those whose number of Urls is to be decremented", () => {
      const result = selectTagIdsForUpdate({ currentTagIds, newTagIds });

      expect(result.decrement).toEqual(currentTagIds);
    });
  });

  describe("when some of the new tag IDs exist on the list of current Url tag IDs", () => {
    const currentTagIds = ["a", "b", "c"];
    const newTagIds = ["c", "d", "e"];

    it("should select only those new tag IDs for increment that are not on the current list", () => {
      const result = selectTagIdsForUpdate({ currentTagIds, newTagIds });

      expect(result.increment).toEqual(["d", "e"]);
    });

    it("should select only those current tag IDs for decrement that are not on the new list", () => {
      const result = selectTagIdsForUpdate({ currentTagIds, newTagIds });

      expect(result.decrement).toEqual(["a", "b"]);
    });
  });

  describe("when all of the new tag IDs exist on the list of current Url tag IDs", () => {
    const currentTagIds = ["a", "b", "c"];
    const newTagIds = ["a", "b", "c"];

    it("should not select any tag ID for increment (nothing changed)", () => {
      const result = selectTagIdsForUpdate({ currentTagIds, newTagIds });

      expect(result.increment).toEqual([]);
    });

    it("should not select any tag ID for decrement (nothing changed)", () => {
      const result = selectTagIdsForUpdate({ currentTagIds, newTagIds });

      expect(result.decrement).toEqual([]);
    });
  });
});
