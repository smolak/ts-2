import type * as jestExtended from "jest-extended";

/**
 * Type declarations for Jest Extended matchers in Vitest
 *
 * This file extends Vitest's expect interface with Jest Extended matchers.
 * The module augmentation approach is the standard way to extend Vitest types
 * and is designed to be resilient to minor Vitest updates.
 *
 * Compatibility:
 * - Safe for Vitest minor version updates (e.g., 3.2.x → 3.3.x)
 * - May require updates for major version changes (e.g., 3.x → 4.x)
 * - Compatible with Jest Extended updates
 */
declare module "vitest" {
  interface Assertion<T = unknown> extends jestExtended.Matchers<T> {}
  interface AsymmetricMatchersContaining extends jestExtended.Matchers {}
}
