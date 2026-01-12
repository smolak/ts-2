import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { completeUserProfileSchema } from "./complete-user-profile.schema";

describe("completeUserProfileSchema", () => {
  it("should validate a valid user profile with username and apiKey", () => {
    const data = {
      username: "testuser",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when username is missing", () => {
    const data = {
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when apiKey is missing", () => {
    const data = {
      username: "testuser",
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should fail when username is too short (less than 4 chars)", () => {
    const data = {
      username: "abc",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.username?.errors).toContain(
        "Username cannot be shorter than 4 and longer than 15 characters.",
      );
    }
  });

  it("should fail when username is too long (more than 15 chars)", () => {
    const data = {
      username: "a".repeat(16),
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.username?.errors).toContain(
        "Username cannot be shorter than 4 and longer than 15 characters.",
      );
    }
  });

  it("should fail when username contains invalid characters", () => {
    const data = {
      username: "user@name",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should validate username with underscore", () => {
    const data = {
      username: "user_name",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate username with numbers", () => {
    const data = {
      username: "user123",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should fail when apiKey has wrong length", () => {
    const data = {
      username: "testuser",
      apiKey: "tooshort",
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(z.treeifyError(result.error).properties?.apiKey?.errors).toContain(
        "API Key must be exactly 30 characters long.",
      );
    }
  });

  it("should fail when apiKey contains invalid characters", () => {
    const data = {
      username: "testuser",
      apiKey: "!@#$%^&*()".repeat(3),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it("should trim whitespace from username", () => {
    const data = {
      username: "  testuser  ",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("testuser");
    }
  });

  it("should trim whitespace from apiKey", () => {
    const apiKey = generateApiKey();
    const data = {
      username: "testuser",
      apiKey: `  ${apiKey}  `,
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apiKey).toBe(apiKey);
    }
  });

  it("should validate username at minimum length (4 chars)", () => {
    const data = {
      username: "user",
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it("should validate username at maximum length (15 chars)", () => {
    const data = {
      username: "a".repeat(15),
      apiKey: generateApiKey(),
    };

    const result = completeUserProfileSchema.safeParse(data);

    expect(result.success).toBe(true);
  });
});
