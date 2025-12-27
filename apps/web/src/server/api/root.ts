import { decksRouter } from "@/features/deck/router/decks";
import { feedsRouter } from "@/features/feed/router/feeds";
import { tagsRouter } from "@/features/tag/router/tags";
import { urlsRouter } from "@/features/url/router/urls";
import { usersRouter } from "@/features/user/router/users";
import { userProfilesRouter } from "@/features/user-profile/router/user-profiles";
import { createCallerFactory, createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  decks: decksRouter,
  tags: tagsRouter,
  users: usersRouter,
  userProfiles: userProfilesRouter,
  feeds: feedsRouter,
  userUrls: urlsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
