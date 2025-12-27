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
import { generateRequestId } from "@repo/db/id/request-id";
import { vi } from "vitest";
import type { Logger } from "@/features/logger";
import { cleanupUser, createTestUser } from "./test-db";

type ClerkAuth = Awaited<ReturnType<typeof auth>>;

/**
 * Mock auth object that simulates a logged-in Clerk user
 */
function createMockAuth(clerkUserId: string): ClerkAuth {
  return {
    userId: clerkUserId,
    sessionId: `sess_test_${Date.now()}`,
    sessionClaims: {},
    orgId: null,
    orgRole: null,
    orgSlug: null,
    orgPermissions: null,
    has: () => false,
    debug: () => ({}),
    isPublicRoute: false,
    isApiRoute: false,
    protect: vi.fn(),
    redirectToSignIn: vi.fn(),
    isAuthenticated: true,
  } as unknown as ClerkAuth;
}

/**
 * Mock auth object that simulates an unauthenticated user
 */
function createUnauthenticatedMockAuth(): ClerkAuth {
  return {
    userId: null,
    sessionId: null,
    sessionClaims: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    orgPermissions: null,
    has: () => false,
    debug: () => ({}),
    isPublicRoute: false,
    isApiRoute: false,
    protect: vi.fn(),
    redirectToSignIn: vi.fn(),
    isAuthenticated: false,
  } as unknown as ClerkAuth;
}

/**
 * Create a mock logger that captures log calls for assertions
 */
function createMockLogger(): Logger {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
    level: "info",
    silent: vi.fn(),
    bindings: vi.fn().mockReturnValue({}),
    flush: vi.fn(),
    isLevelEnabled: vi.fn().mockReturnValue(true),
  } as unknown as Logger;
}

export type TestContext = {
  /** The tRPC context to pass to createCaller */
  trpcContext: {
    db: typeof db;
    auth: ClerkAuth;
    logger: Logger;
    requestId: string;
  };
  /** The test user's internal ID */
  userId: string;
  /** The test user's Clerk ID */
  clerkUserId: string;
  /** Access to the mock logger for assertions */
  mockLogger: Logger;
  /** Access to the database for direct queries */
  db: typeof db;
  /** Cleanup function to call in afterEach */
  cleanup: () => Promise<void>;
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

  const trpcContext = {
    db,
    auth,
    logger: mockLogger,
    requestId,
  };

  const cleanup = async () => {
    await cleanupUser(db, user.id);
  };

  return {
    trpcContext,
    userId: user.id,
    clerkUserId,
    mockLogger,
    db,
    cleanup,
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
