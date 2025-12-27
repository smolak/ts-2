import { createTRPCRouter } from "@/server/api/trpc";
import { updateDeckUrlTags } from "./procedures/update-user-url";

export const urlsRouter = createTRPCRouter({
  updateDeckUrlTags,
});
