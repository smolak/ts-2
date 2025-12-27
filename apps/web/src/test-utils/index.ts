/**
 * Test Utilities for tRPC Procedure Integration Tests
 *
 * This module provides utilities for testing tRPC procedures with:
 * - Real database interactions (not mocks)
 * - Mocked authentication
 * - Mocked logging
 * - Proper cleanup between tests
 *
 * @example
 * ```typescript
 * import { createTestContext, createTestTag, cleanupTags } from "@/test-utils";
 * import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
 * import { deleteTag } from "./delete-tag";
 *
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
 *     const tag = await createTestTag(ctx.db, ctx.userId, "Test Tag");
 *     const caller = createCaller(ctx.trpcContext);
 *
 *     await caller.deleteTag({ id: tag.id });
 *
 *     // Verify tag was deleted
 *     const result = await ctx.db.query.tags.findFirst({
 *       where: (tags, { eq }) => eq(tags.id, tag.id),
 *     });
 *     expect(result).toBeUndefined();
 *   });
 * });
 * ```
 */

export {
  type CreateTestContextOptions,
  createSecondTestUser,
  createTestContext,
  type TestContext,
} from "./create-test-context";
export { cleanupTags, cleanupUser, createTestTag, createTestUser } from "./test-db";
