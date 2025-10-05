import { db } from "@repo/db/db";
import type { RequestId } from "@repo/db/id/request-id";
import type { User } from "@repo/db/schema";
import { type ApiKey, apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { type Logger, logger } from "@/features/logger";

export const getUserIdFromRequestFactory =
  (logger: Logger, getUserIdByApiKey: GetUserIdByApiKey) =>
  async (request: Request, requestId: RequestId, actionType: string): Promise<User["id"] | null> => {
    const apiKey = request.headers.get("authorization")?.split("Bearer ")?.[1];
    const apiKeyCheckResult = apiKeySchema.safeParse(apiKey);

    if (!apiKeyCheckResult.success) {
      logger.error({ requestId, actionType }, "Invalid ApiKey provided.");

      return null;
    }

    const userId = await getUserIdByApiKey(apiKeyCheckResult.data);

    if (!userId) {
      logger.error({ requestId, actionType }, "User identified by ApiKey not found.");

      return null;
    }

    return userId;
  };

type GetUserIdByApiKey = (apiKey: ApiKey) => Promise<User["id"] | undefined>;

const getUserIdByApiKey: GetUserIdByApiKey = async (apiKey: ApiKey) => {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
    },
    where: (users, { eq }) => eq(users.apiKey, apiKey),
  });

  return user?.id;
};

export const getUserIdFromRequest = getUserIdFromRequestFactory(logger, getUserIdByApiKey);
