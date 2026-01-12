import type { User } from "@clerk/nextjs/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

// Mock the Clerk module before importing the procedure
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(),
  currentUser: vi.fn(),
}));

// Import after mocking
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { createTestContext, createTestUserProfile, type TestContext } from "@/test-utils";
import { createUserProfile } from "./create-user-profile";

const testRouter = createTRPCRouter({ createUserProfile });
const createCaller = createCallerFactory(testRouter);

describe("createUserProfile procedure", () => {
  let ctx: TestContext;
  const validApiKey = generateApiKey();
  const validUsername = "newuser1";

  const mockClerkUser = mock<User>({
    id: "clerk_user_123",
    imageUrl: "https://example.com/avatar.png",
  });

  const mockUpdateUserMetadata = vi.fn().mockResolvedValue({});
  const mockClerkClient = {
    users: {
      updateUserMetadata: mockUpdateUserMetadata,
    },
  };

  beforeEach(async () => {
    ctx = await createTestContext();

    // Setup default mock implementations
    vi.mocked(currentUser).mockResolvedValue(mockClerkUser);
    vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as never);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await ctx.cleanup();
  });

  it("should create user profile successfully", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createUserProfile({
      username: validUsername,
      apiKey: validApiKey,
    });

    expect(result).toMatchObject({
      username: validUsername,
      userId: ctx.userId,
      imageUrl: mockClerkUser.imageUrl,
    });

    // Verify the profile was created in the database
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, ctx.userId),
    });
    expect(profile).toMatchObject({ username: validUsername });

    // Verify apiKey was saved in the users table
    const user = await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.userId),
      columns: { apiKey: true },
    });
    expect(user).toMatchObject({ apiKey: validApiKey });

    // Verify Clerk was called to update user metadata
    expect(clerkClient).toHaveBeenCalled();
    expect(mockUpdateUserMetadata).toHaveBeenCalledWith(mockClerkUser.id, {
      publicMetadata: {
        appUserId: ctx.userId,
      },
    });

    expect(ctx.mockLogger.info).toHaveBeenCalledWith(
      { requestId: ctx.trpcContext.requestId, path: "userProfile.createUserProfile" },
      "User profile creation complete.",
    );
  });

  it("should throw BAD_REQUEST when profile already exists", async () => {
    await createTestUserProfile(ctx.db, ctx.userId, "existing", "https://example.com/old.png");
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.createUserProfile({
        username: validUsername,
        apiKey: validApiKey,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "User profile already exists.",
    });
  });

  it("should throw BAD_REQUEST when Clerk user doesn't exist", async () => {
    vi.mocked(currentUser).mockResolvedValueOnce(null);
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.createUserProfile({
        username: validUsername,
        apiKey: validApiKey,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "User doesn't exist on the auth provider.",
    });
  });

  it("should reject restricted username 'admin'", async () => {
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.createUserProfile({
        username: "admin",
        apiKey: validApiKey,
      }),
    ).rejects.toThrow();
  });

  it("should reject restricted username 'urlshare'", async () => {
    const caller = createCaller(ctx.trpcContext);

    await expect(
      caller.createUserProfile({
        username: "urlshare",
        apiKey: validApiKey,
      }),
    ).rejects.toThrow();
  });

  it("should allow username starting with urlshare but longer", async () => {
    const caller = createCaller(ctx.trpcContext);

    const result = await caller.createUserProfile({
      username: "urlshare_fan",
      apiKey: validApiKey,
    });

    expect(result.username).toBe("urlshare_fan");
  });

  it("should normalize username for storage", async () => {
    const caller = createCaller(ctx.trpcContext);

    await caller.createUserProfile({
      username: "MyUser123",
      apiKey: validApiKey,
    });

    const profile = await ctx.db.query.userProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, ctx.userId),
    });
    expect(profile?.username).toBe("MyUser123");
    expect(profile?.usernameNormalized).toBe("myuser123");
  });
});
