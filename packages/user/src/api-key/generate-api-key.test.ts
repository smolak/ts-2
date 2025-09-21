import { describe, expect, it } from "vitest";
import { generateApiKey } from "./generate-api-key";

describe("generateApiKey", () => {
  it("should generate a 30 chars length alphanumerical string", () => {
    const id = generateApiKey();

    expect(id).toMatch(/^[a-zA-Z0-9_]{30}$/);
  });
});
