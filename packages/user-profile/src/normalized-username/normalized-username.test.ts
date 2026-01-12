import { describe, expect, it } from "vitest";

import { type NormalizedUsername, normalizedUsernameSchema, normalizeUsername } from "./normalized-username.js";

describe("normalizeUsername", () => {
  it("should lowercase passed username", () => {
    const usernames = [
      { input: "jacek", output: "jacek" },
      { input: "JACEK", output: "jacek" },
      { input: "Jacek", output: "jacek" },
      { input: "JaCeK", output: "jacek" },
      { input: "jaCek", output: "jacek" },
    ];

    for (const { input, output } of usernames) {
      expect(normalizeUsername(input)).toEqual(output);
    }
  });

  it("should return a NormalizedUsername branded type", () => {
    const result = normalizeUsername("TestUser");

    // TypeScript ensures this assignment is valid
    const normalized: NormalizedUsername = result;
    expect(normalized).toBe("testuser");
  });
});

describe("normalizedUsernameSchema", () => {
  it("should accept lowercase usernames", () => {
    const validUsernames = ["johndoe", "alice123", "test_user"];

    for (const username of validUsernames) {
      const result = normalizedUsernameSchema.safeParse(username);
      expect(result.success).toBe(true);
    }
  });

  it("should reject non-lowercase usernames", () => {
    const invalidUsernames = ["JohnDoe", "ALICE", "Test_User", "mixedCase123"];

    for (const username of invalidUsernames) {
      const result = normalizedUsernameSchema.safeParse(username);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.format()._errors).toContain("Username must be normalized (lowercase)");
      }
    }
  });

  it("should reject empty strings", () => {
    const result = normalizedUsernameSchema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.format()._errors).toContain("Username cannot be empty");
    }
  });

  it("should correctly infer NormalizedUsername type on success", () => {
    const result = normalizedUsernameSchema.parse("validusername");

    // TypeScript ensures this assignment is valid
    const normalized: NormalizedUsername = result;
    expect(normalized).toBe("validusername");
  });
});
