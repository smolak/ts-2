import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const FEED_ID_PREFIX = "feed_" as const;
export const FEED_ID_LENGTH = DEFAULT_ID_LENGTH + FEED_ID_PREFIX.length;

export const generateFeedId = (): string => generateId(FEED_ID_PREFIX);

export type FeedId = z.infer<typeof feedIdSchema>;

export const feedIdSchema = z
  .string()
  .trim()
  .startsWith(FEED_ID_PREFIX, { message: "ID passed is not a feed ID." })
  .length(FEED_ID_LENGTH, { message: "Wrong ID size." });
