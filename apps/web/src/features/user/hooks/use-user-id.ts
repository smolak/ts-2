import { useUser } from "@clerk/nextjs";
import type { UserId } from "@repo/db/id/user-id";

export const useUserId = (): UserId | undefined => {
  const { user } = useUser();

  if (user?.publicMetadata.appUserId) {
    return user.publicMetadata.appUserId as UserId;
  }
};
