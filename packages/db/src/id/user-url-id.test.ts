import { describe, expect, it } from "vitest";
import { generateUserUrlId } from "./user-url-id";

describe("generateUserUrlId", () => {
  it("should prefix id with user url prefix", () => {
    const id = generateUserUrlId();

    expect(id).toMatch(/^user_url_[a-zA-Z0-9]{22}$/);
  });
});
