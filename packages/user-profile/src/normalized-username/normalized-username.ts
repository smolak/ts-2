import z from "zod";

/**
 * Branded type for normalized (lowercase) usernames.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * where a `NormalizedUsername` is expected. The only way to obtain this type
 * is through the `normalizeUsername` function.
 *
 * @example
 * ```ts
 * const normalized = normalizeUsername("JohnDoe"); // NormalizedUsername
 * const plain = "johndoe"; // string - NOT assignable to NormalizedUsername
 * ```
 */
declare const NormalizedUsernameBrand: unique symbol;
export type NormalizedUsername = string & { readonly [NormalizedUsernameBrand]: typeof NormalizedUsernameBrand };

/**
 * Normalizes a username to lowercase and returns a branded `NormalizedUsername` type.
 *
 * This is the only way to create a `NormalizedUsername` value, ensuring that
 * any code receiving this type can trust the value is already normalized.
 */
export const normalizeUsername = (username: string): NormalizedUsername => username.toLowerCase() as NormalizedUsername;

/**
 * Zod schema that validates a string is a normalized username (lowercase).
 *
 * Use this schema in tRPC procedure inputs to validate that callers
 * have properly normalized the username before sending it.
 */
export const normalizedUsernameSchema = z
  .string()
  .min(1, "Username cannot be empty")
  .refine((val): val is NormalizedUsername => val === normalizeUsername(val), {
    message: "Username must be normalized (lowercase)",
  });
