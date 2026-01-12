import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createUserProfileSchema, NOT_ALLOWED_NORMALIZED_USERNAMES } from "./create-user-profile";

function generateCaseCombinations(word: string) {
  function backtrack(index: number, currentCombination: string) {
    if (index === word.length) {
      combinations.push(currentCombination);
      return;
    }

    const letter = word[index] as string;

    backtrack(index + 1, currentCombination + letter.toLowerCase());
    backtrack(index + 1, currentCombination + letter.toUpperCase());
  }

  const combinations: string[] = [];
  backtrack(0, "");

  return combinations;
}

const apiKey = generateApiKey();

describe("createUserProfileSchema", () => {
  it("fails validation when using not allowed usernames", () => {
    const notAllowedUsernames = NOT_ALLOWED_NORMALIZED_USERNAMES.flatMap((username) => {
      return generateCaseCombinations(username);
    });

    notAllowedUsernames.forEach((username) => {
      const data = {
        username,
        apiKey,
      };

      const result = createUserProfileSchema.safeParse(data);

      expect(result.success).toEqual(false);

      if (!result.success) {
        expect(z.treeifyError(result.error).properties?.username?.errors).toContain("Username not allowed.");
      }
    });
  });
});
