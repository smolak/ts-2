/**
 * Test Context Factory
 *
 * Creates a test context for tRPC procedures that includes:
 * - Real test database (not mocks)
 * - Mocked auth (to simulate authenticated/unauthenticated users)
 * - Mocked logger (to verify logging calls)
 * - Real request ID generation
 *
 * Usage:
 * ```typescript
 * const testRouter = createTRPCRouter({ deleteTag });
 * const createCaller = createCallerFactory(testRouter);
 *
 * describe("deleteTag", () => {
 *   let ctx: TestContext;
 *
 *   beforeEach(async () => {
 *     ctx = await createTestContext();
 *   });
 *
 *   afterEach(async () => {
 *     await ctx.cleanup();
 *   });
 *
 *   it("should delete a tag", async () => {
 *     const caller = createCaller(ctx.trpcContext);
 *     await caller.deleteTag({ id: tag.id });
 *   });
 * });
 * ```
 */

import type { auth } from "@clerk/nextjs/server";
import { db } from "@repo/db/db";
import { generateRequestId, type RequestId } from "@repo/db/id/request-id";
import type { UserId } from "@repo/db/id/user-id";
import { mock } from "vitest-mock-extended";
import type { Logger } from "@/features/logger";
import { cleanupUser, createTestUser } from "./test-db";

type ClerkAuth = Awaited<ReturnType<typeof auth>>;

/**
 * Mock auth object that simulates a logged-in Clerk user
 * Note: ClerkAuth is a complex union type, so we cast to bypass strict type checking
 */
function createMockAuth(clerkUserId: string): ClerkAuth {
  return mock({
    userId: clerkUserId,
    sessionId: `sess_test_${Date.now()}`,
    sessionClaims: {},
    orgId: null,
    orgRole: null,
    orgSlug: null,
    orgPermissions: null,
    isPublicRoute: false,
    isApiRoute: false,
    isAuthenticated: true,
  }) as unknown as ClerkAuth;
}

/**
 * Mock auth object that simulates an unauthenticated user
 * Note: ClerkAuth is a complex union type, so we cast to bypass strict type checking
 */
function createUnauthenticatedMockAuth(): ClerkAuth {
  return mock({
    userId: null,
    sessionId: null,
    sessionClaims: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    orgPermissions: null,
    isPublicRoute: false,
    isApiRoute: false,
    isAuthenticated: false,
  }) as unknown as ClerkAuth;
}

/**
 * Create a mock logger that captures log calls for assertions
 */
function createMockLogger(): Logger {
  return mock<Logger>();
}

/** Additional user created during a test */
export type AdditionalTestUser = {
  userId: UserId;
  clerkUserId: string;
};

export type TestContext = {
  /** The tRPC context to pass to createCaller */
  trpcContext: {
    db: typeof db;
    auth: ClerkAuth;
    logger: Logger;
    requestId: RequestId;
  };
  /** The tRPC context with unauthenticated auth (for public procedures) */
  unauthTrpcContext: {
    db: typeof db;
    auth: ClerkAuth;
    logger: Logger;
    requestId: RequestId;
  };
  /** The test user's internal ID */
  userId: UserId;
  /** The test user's Clerk ID */
  clerkUserId: string;
  /** Access to the mock logger for assertions */
  mockLogger: Logger;
  /** Access to the database for direct queries */
  db: typeof db;
  /** Cleanup function to call in afterEach */
  cleanup: () => Promise<void>;
  /** Create an additional user that is auto-cleaned up */
  createAdditionalUser: () => Promise<AdditionalTestUser>;
};

export type CreateTestContextOptions = {
  /** Whether to create an authenticated context (default: true) */
  authenticated?: boolean;
};

/**
 * Create a test context for tRPC procedure testing
 *
 * @param options - Configuration options
 * @returns TestContext with trpcContext, cleanup function, and helper properties
 */
export async function createTestContext(options: CreateTestContextOptions = {}): Promise<TestContext> {
  const { authenticated = true } = options;

  const clerkUserId = `clerk_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const mockLogger = createMockLogger();
  const requestId = generateRequestId();

  // Create test user in database (the middleware will do this, but we need the ID)
  const user = await createTestUser(db, clerkUserId);

  const auth = authenticated ? createMockAuth(clerkUserId) : createUnauthenticatedMockAuth();
  const unauthAuth = createUnauthenticatedMockAuth();

  const trpcContext = {
    db,
    auth,
    logger: mockLogger,
    requestId,
  };

  const unauthTrpcContext = {
    db,
    auth: unauthAuth,
    logger: mockLogger,
    requestId,
  };

  // Track additional users for automatic cleanup
  const additionalUsers: AdditionalTestUser[] = [];

  const createAdditionalUser = async (): Promise<AdditionalTestUser> => {
    const additionalClerkUserId = `clerk_test2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const additionalUser = await createTestUser(db, additionalClerkUserId);
    const testUser = { userId: additionalUser.id, clerkUserId: additionalClerkUserId };
    additionalUsers.push(testUser);
    return testUser;
  };

  const cleanup = async () => {
    // Clean up additional users first (in reverse order of creation)
    for (const additionalUser of additionalUsers.reverse()) {
      await cleanupUser(db, additionalUser.userId);
    }
    // Clean up primary user
    await cleanupUser(db, user.id);
  };

  return {
    trpcContext,
    unauthTrpcContext,
    userId: user.id,
    clerkUserId,
    mockLogger,
    db,
    cleanup,
    createAdditionalUser,
  };
}

/**
 * Create a second test user for multi-user test scenarios
 *
 * @param db - Database instance
 * @returns Object with userId and cleanup function
 */
export async function createSecondTestUser(dbInstance: typeof db) {
  const clerkUserId = `clerk_test2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const user = await createTestUser(dbInstance, clerkUserId);

  return {
    userId: user.id,
    clerkUserId,
    cleanup: async () => {
      await cleanupUser(dbInstance, user.id);
    },
  };
}
