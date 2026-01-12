import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const TAG_ID_PREFIX = "tag_" as const;
export const TAG_ID_LENGTH = DEFAULT_ID_LENGTH + TAG_ID_PREFIX.length;

/**
 * Branded type for Tag IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `TagId` is expected.
 */
declare const TagIdBrand: unique symbol;
export type TagId = string & { readonly [TagIdBrand]: typeof TagIdBrand };

export const generateTagId = (): TagId => generateId(TAG_ID_PREFIX) as TagId;

export const tagIdSchema = z
  .string()
  .trim()
  .startsWith(TAG_ID_PREFIX, { message: "ID passed is not a tag ID." })
  .length(TAG_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is TagId => true);
