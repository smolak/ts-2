import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import type { Logger } from "@/features/logger";
import { getUserIdFromRequestFactory } from "./get-user-id-from-request";

describe("getUserIdFromRequest", () => {
  const requestId = "test-request-id";
  const actionType = "test-action-type";

  const mockLogger = mock<Logger>();
  const mockGetUserIdByApiKey = vi.fn();

  const getUserIdFromRequest = getUserIdFromRequestFactory(mockLogger, mockGetUserIdByApiKey);

  it("returns user id when valid apiKey is provided and user is found", async () => {
    const request = { headers: { get: vi.fn().mockReturnValue(`Bearer ${generateApiKey()}`) } } as unknown as Request;
    mockGetUserIdByApiKey.mockResolvedValue("user-id");

    const result = await getUserIdFromRequest(request, requestId, actionType);

    expect(result).toBe("user-id");
  });

  it("returns null when apiKey is missing", async () => {
    const request = { headers: { get: vi.fn().mockReturnValue("") } } as unknown as Request;

    const result = await getUserIdFromRequest(request, requestId, actionType);

    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith({ requestId, actionType }, "Invalid ApiKey provided.");
  });

  it("returns null when apiKey is invalid", async () => {
    const request = { headers: { get: vi.fn().mockReturnValue("Bearer invalid-api-key") } } as unknown as Request;

    const result = await getUserIdFromRequest(request, requestId, actionType);

    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith({ requestId, actionType }, "Invalid ApiKey provided.");
  });

  it("returns null when user is not found", async () => {
    const request = { headers: { get: vi.fn().mockReturnValue(`Bearer ${generateApiKey()}`) } } as unknown as Request;
    mockGetUserIdByApiKey.mockResolvedValue(undefined);

    const result = await getUserIdFromRequest(request, requestId, actionType);

    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalledWith({ requestId, actionType }, "User identified by ApiKey not found.");
  });
});
