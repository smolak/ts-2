import { z } from "zod";

export type UserId = z.infer<typeof userIdSchema>;

export const userIdSchema = z.string().startsWith("user_");
