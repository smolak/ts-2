import { z } from "zod";

import { FEED_ID_LENGTH, FEED_ID_PREFIX } from "./feed-id";

export const feedIdSchema = z
  .string()
  .trim()
  .startsWith(FEED_ID_PREFIX, { message: "ID passed is not a feed ID." })
  .length(FEED_ID_LENGTH, { message: "Wrong ID size." });
