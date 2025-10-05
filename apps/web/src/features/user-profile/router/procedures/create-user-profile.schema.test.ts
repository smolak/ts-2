import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { describe, expect, it } from "vitest";
import type { ZodSafeParseError } from "zod";
import {
  type CreateUserProfileSchema,
  createUserProfileSchema,
  NOT_ALLOWED_NORMALIZED_USERNAMES,
} from "./create-user-profile";

function generateCaseCombinations(word: string) {
  function backtrack(index: number, currentCombination: string) {
    if (index === word.length) {
      combinations.push(currentCombination);
      return;
    }

    const letter = word[index]!;

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

      const result = createUserProfileSchema.safeParse(data) as ZodSafeParseError<CreateUserProfileSchema>;

      expect(result.success).toEqual(false);
      expect(result.error.format().username?._errors).toContain("Username not allowed.");
    });
  });
});
