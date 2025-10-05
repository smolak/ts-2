"use client";

// import { usePathname } from "next/navigation";
import { createContext, useEffect } from "react";
import { useUserStore } from "@/features/user/store/user-store-provider";
import { api } from "@/trpc/react";

type ProfileContextType = {
  hasProfile: boolean | null;
  isLoading: boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// TODO: this is not used anywhere. Probably WIP.
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // const pathname = usePathname();
  const { profile, setProfile } = useUserStore((state) => state);

  const {
    data,
    isLoading,
    // refetch
  } = api.userProfiles.getPrivateUserProfile.useQuery(undefined, {
    enabled: profile === null,
  });

  // 🚀 Force re-check when route changes
  // useEffect(() => {
  //   refetch(); // Ensure the backend is called when navigating
  // }, [pathname, refetch]);

  useEffect(() => {
    if (!isLoading && data) {
      setProfile(data);
    }
  }, [data, isLoading, setProfile]);

  return (
    // WIP
    <ProfileContext.Provider value={{ hasProfile: true /** cachedProfile ?? hasProfile ?? null **/, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}
