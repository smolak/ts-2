import { categoriesRouter } from "@/features/category/router/categories";
import { feedsRouter } from "@/features/feed/router/feeds";
import { followUserRouter } from "@/features/follow-user/router/follow-user";
import { usersRouter } from "@/features/user/router/users";
import { userProfilesRouter } from "@/features/user-profile/router/user-profiles";
import { createCallerFactory, createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  followUser: followUserRouter,
  users: usersRouter,
  userProfiles: userProfilesRouter,
  feeds: feedsRouter,
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
