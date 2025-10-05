import { createTRPCRouter } from "@/server/api/trpc";
import { updateUserUrl } from "./procedures/update-user-url";

export const urlsRouter = createTRPCRouter({
  updateUserUrl,
});
