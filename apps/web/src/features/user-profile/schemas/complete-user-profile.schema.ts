import { apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { z } from "zod";

export type CompleteUserProfileSchema = z.infer<typeof completeUserProfileSchema>;

export const completeUserProfileSchema = z.object({
  username: usernameSchema,
  apiKey: apiKeySchema,
});
