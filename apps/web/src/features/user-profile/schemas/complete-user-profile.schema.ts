import { usernameSchema } from "@workspace/user-profile/username/schemas/username.schema";
import { apiKeySchema } from "@workspace/user/api-key/api-key.schema";
import { z } from "zod";

export type CompleteUserProfileSchema = z.infer<typeof completeUserProfileSchema>;

export const completeUserProfileSchema = z.object({
  username: usernameSchema,
  apiKey: apiKeySchema,
});
