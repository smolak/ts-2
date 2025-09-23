import { describe, expect, it } from "vitest";
import { generateUserProfileId } from "./user-profile-id";

describe("generateUserProfileId", () => {
  it("should prefix id with user profile prefix", () => {
    const id = generateUserProfileId();

    expect(id).toMatch(/^user_pr_[a-zA-Z0-9]{22}$/);
  });
});
