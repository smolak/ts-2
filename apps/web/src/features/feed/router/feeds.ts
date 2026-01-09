import { createTRPCRouter } from "@/server/api/trpc";

import { getMyFeed } from "./procedures/get-my-feed";
import { getPublicFeed } from "./procedures/get-public-feed";
import { toggleLikeUrl } from "./procedures/toggle-like-url";

export const feedsRouter = createTRPCRouter({
  getMyFeed,
  getPublicFeed,
  toggleLikeUrl,
});
