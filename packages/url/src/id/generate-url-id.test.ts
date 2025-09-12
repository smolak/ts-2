import { describe, expect, it } from "vitest";

import { generateUrlId } from "./generate-url-id";

describe("generateUrlId", () => {
  it("should prefix id with url prefix", () => {
    const id = generateUrlId();

    expect(id).toMatch(/^url_[a-zA-Z0-9]{22}$/);
  });
});
