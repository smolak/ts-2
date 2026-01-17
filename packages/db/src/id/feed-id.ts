import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const FEED_ID_PREFIX = "feed_" as const;
export const FEED_ID_LENGTH = DEFAULT_ID_LENGTH + FEED_ID_PREFIX.length;

/**
 * Branded type for Feed IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `FeedId` is expected.
 */
declare const FeedIdBrand: unique symbol;
export type FeedId = string & { readonly [FeedIdBrand]: typeof FeedIdBrand };

export const generateFeedId = (): FeedId => generateId(FEED_ID_PREFIX) as FeedId;

export const feedIdSchema = z
  .string()
  .trim()
  .startsWith(FEED_ID_PREFIX, { message: "ID passed is not a feed ID." })
  .length(FEED_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is FeedId => true);
