import { describe, expect, it } from "vitest";
import { type ZodSafeParseError, type ZodSafeParseSuccess, z } from "zod";

import { type ApiKey, apiKeySchema } from "./api-key.schema";
import { API_KEY_ALPHABET, generateApiKey } from "./generate-api-key";

describe("apiKeySchema", () => {
  it("should be exactly 30 characters long", () => {
    const exactLength = 30;
    const tooShort = exactLength - 1;
    const tooLong = exactLength + 1;

    const exactLengthApiKey = "a".repeat(exactLength);
    const tooShortApiKey = "a".repeat(tooShort);
    const tooLongApiKey = "a".repeat(tooLong);

    expect(() => apiKeySchema.parse(exactLengthApiKey)).not.toThrow();

    const tooShortResult = apiKeySchema.safeParse(tooShortApiKey) as ZodSafeParseError<ApiKey>;

    expect(tooShortResult.success).toEqual(false);
    expect(z.treeifyError(tooShortResult.error).errors).toContain("API Key must be exactly 30 characters long.");

    const tooLongResult = apiKeySchema.safeParse(tooLongApiKey) as ZodSafeParseError<ApiKey>;
    expect(tooLongResult.success).toEqual(false);
    expect(z.treeifyError(tooLongResult.error).errors).toContain("API Key must be exactly 30 characters long.");
  });

  it("should allow only the ID generator dictionary characters to be used", () => {
    const validApiKey = generateApiKey();

    expect(() => apiKeySchema.parse(validApiKey)).not.toThrow();

    const invalidCharactersExamples = ["ą".repeat(30), "-".repeat(30)];

    invalidCharactersExamples.forEach((apiKey) => {
      const result = apiKeySchema.safeParse(apiKey) as ZodSafeParseError<ApiKey>;

      expect(result.success).toEqual(false);
      expect(z.treeifyError(result.error).errors).toContain(`Only ${API_KEY_ALPHABET} characters allowed.`);
    });
  });

  it("should trim entered API key", () => {
    const apiKey = "a".repeat(30);
    const apiKeysWithSpacesAroundThem = [
      ` ${apiKey}`,
      `${apiKey} `,
      ` ${apiKey} `,
      `   ${apiKey}   `,
      `\n\t   ${apiKey}   \t\n`,
    ];

    apiKeysWithSpacesAroundThem.forEach((apiKeyWithSpaces) => {
      const result = apiKeySchema.safeParse(apiKeyWithSpaces) as ZodSafeParseSuccess<ApiKey>;

      expect(result.data).toEqual(apiKey);
    });
  });
});
