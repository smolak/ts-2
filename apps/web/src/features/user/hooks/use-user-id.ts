import { useUser } from "@clerk/nextjs";

export const useUserId = () => {
  const { user } = useUser();

  if (user?.publicMetadata.appUserId) {
    return user.publicMetadata.appUserId as string;
  }
};
