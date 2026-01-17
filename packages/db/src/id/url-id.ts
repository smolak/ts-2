import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const URL_ID_PREFIX = "url_" as const;
export const URL_ID_LENGTH = DEFAULT_ID_LENGTH + URL_ID_PREFIX.length;

/**
 * Branded type for Url IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `UrlId` is expected.
 */
declare const UrlIdBrand: unique symbol;
export type UrlId = string & { readonly [UrlIdBrand]: typeof UrlIdBrand };

export const generateUrlId = (): UrlId => generateId(URL_ID_PREFIX) as UrlId;

export const urlIdSchema = z
  .string()
  .trim()
  .startsWith(URL_ID_PREFIX, { message: "ID passed is not a url ID." })
  .length(URL_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is UrlId => true);
