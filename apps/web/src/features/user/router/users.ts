import { createTRPCRouter } from "@/server/api/trpc";
import { updateUser } from "./procedures/update-user";

export const usersRouter = createTRPCRouter({
  updateUser,
});
