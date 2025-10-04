import { createTRPCRouter } from "@/server/api/trpc";

import { getUserFeed } from "./procedures/get-user-feed";
import { toggleLikeUrl } from "./procedures/toggle-like-url";

export const feedsRouter = createTRPCRouter({
  getUserFeed,
  toggleLikeUrl,
});
