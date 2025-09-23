import { describe, expect, it } from "vitest";
import type { ZodSafeParseError, ZodSafeParseSuccess } from "zod";

import { type UsernameSchema, usernameSchema } from "./username.schema.js";

describe("usernameSchema", () => {
  it("should allow to use _azAZ09 characters only", () => {
    const validUsernames = ["Jacek", "_Jacek", "Jacek_", "Jacek123", "J_a_c_e_k", "__Jacek__", "123_jacek__"];

    validUsernames.forEach((username) => {
      expect(() => usernameSchema.parse(username)).not.toThrow();
    });

    const invalidUsernames = ["with spaces", "nonAZchars_ęóą", "badChars_!@#$%^"];

    invalidUsernames.forEach((username) => {
      const result = usernameSchema.safeParse(username) as ZodSafeParseError<UsernameSchema>;

      expect(result.success).toEqual(false);
      expect(result.error.format()._errors).toContain(
        "Only abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ1234567890_ characters allowed.",
      );
    });
  });

  it("should allow for min 4 and max 15 character long values", () => {
    const minLength = 4;
    const maxLength = 15;

    const usernamesWithinLengthLimit = ["a".repeat(minLength), "a".repeat(maxLength)];
    const usernamesOutsideOfLengthLimit = ["a".repeat(minLength - 1), "a".repeat(maxLength + 1)];

    usernamesWithinLengthLimit.forEach((username) => {
      expect(() => usernameSchema.parse(username)).not.toThrow();
    });

    usernamesOutsideOfLengthLimit.forEach((username) => {
      const result = usernameSchema.safeParse(username) as ZodSafeParseError<UsernameSchema>;

      expect(result.success).toEqual(false);
      expect(result.error.format()._errors).toContain(
        "Username cannot be shorter than 4 and longer than 15 characters.",
      );
    });
  });

  it("should trim entered string", () => {
    const username = "Jacek";
    const stringsWithSpacesAroundThem = [
      ` ${username}`,
      `${username} `,
      ` ${username} `,
      `   ${username}   `,
      `\n\t   ${username}   \t\n`,
    ];

    stringsWithSpacesAroundThem.forEach((usernameWithSpaces) => {
      const result = usernameSchema.safeParse(usernameWithSpaces) as ZodSafeParseSuccess<UsernameSchema>;

      expect(result.data).toEqual(username);
    });
  });
});
