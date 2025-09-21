import { describe, expect, it } from "vitest";

import { generateCategoryId } from "./category-id";

describe("generateCategoryId", () => {
  it("should prefix id with category prefix", () => {
    const id = generateCategoryId();

    expect(id).toMatch(/^cat_[a-zA-Z0-9]{22}$/);
  });
});
