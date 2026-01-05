/**
 * Centralized route configuration for the LinkDeck platform.
 * Use these constants and helper functions throughout the codebase
 * to ensure consistent route handling.
 */

// ============================================
// Static Routes
// ============================================

export const ROUTES = {
  // Public pages
  home: "/",
  about: "/about",
  terms: "/terms",
  privacy: "/privacy",

  // Auth routes (Clerk-managed)
  signIn: "/sign-in",
  signUp: "/sign-up",

  // User settings (authenticated)
  settings: {
    root: "/settings",
    profile: "/settings/profile",
    decks: "/settings/decks",
    tags: "/settings/tags",
    apiKeys: "/settings/api-keys",
  },

  // Discovery routes
  explore: "/explore",
  trending: "/trending",

  // API routes
  api: {
    v1: {
      deck: "/api/v1/deck",
      tag: "/api/v1/tag",
      url: "/api/v1/url",
    },
  },
} as const;

// ============================================
// Dynamic Route Builders
// ============================================

/**
 * Generates the URL path for a user's profile page.
 * @example userProfile("jacek") // returns "/@jacek"
 */
export const userProfile = (username: string): string => {
  return `/@${username}`;
};

/**
 * Generates the URL path for a user's deck page.
 * @example userDeck("jacek", "my-deck") // returns "/@jacek/my-deck"
 */
export const userDeck = (username: string, slug: string): string => {
  return `/@${username}/${slug}`;
};

// ============================================
// Reserved Routes
// ============================================

/**
 * Reserved route prefixes that cannot be used as usernames.
 * These are checked during user registration to prevent conflicts.
 */
export const RESERVED_ROUTES = [
  // Public pages
  "about",
  "terms",
  "privacy",
  // Auth
  "sign-in",
  "sign-up",
  "auth",
  // App routes
  "settings",
  "explore",
  "trending",
  "search",
  // Admin/System
  "admin",
  "api",
  "help",
  "support",
  // Future-proofing
  "teams",
  "organization",
  "org",
  "blog",
  "docs",
  "pricing",
  "dashboard",
  "feed",
  "notifications",
  "messages",
  "inbox",
] as const;

export type ReservedRoute = (typeof RESERVED_ROUTES)[number];

// ============================================
// Route Validation Helpers
// ============================================

/**
 * Checks if a given path segment is a reserved route.
 * @example isReservedRoute("settings") // returns true
 * @example isReservedRoute("john_doe") // returns false
 */
export const isReservedRoute = (segment: string): boolean => {
  return RESERVED_ROUTES.includes(segment.toLowerCase() as ReservedRoute);
};

/**
 * Checks if a pathname looks like a user profile route.
 * User profile routes start with /@
 * @example isUserProfileRoute("/@jacek") // returns true
 * @example isUserProfileRoute("/settings") // returns false
 */
export const isUserProfileRoute = (pathname: string): boolean => {
  return pathname.startsWith("/@") || pathname.startsWith("/%40");
};

/**
 * Extracts username from a user profile URL path.
 * Handles both @ and %40 (URL-encoded @) prefixes.
 * @example extractUsernameFromPath("/@jacek") // returns "jacek"
 * @example extractUsernameFromPath("/%40jacek") // returns "jacek"
 * @example extractUsernameFromPath("/@jacek/deck") // returns "jacek"
 */
export const extractUsernameFromPath = (pathname: string): string | null => {
  const match = pathname.match(/^\/@([^/]+)|^\/%40([^/]+)/);
  if (!match) return null;
  return match[1] || match[2] || null;
};
