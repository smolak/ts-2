"use client";

import { User } from "@supabase/supabase-js";
import { useEffect } from "react";

import { useUserStore } from "@/features/user/store/user-store-provider";
import { api } from "@/trpc/react";

export const SetUserProfileInState = ({ user }: { user: User | null }) => {
  const { loggedIn, setProfile, clearUser } = useUserStore((state) => state);
  const { data, isLoading } = api.userProfiles.getPrivateUserProfile.useQuery(undefined, {
    enabled: loggedIn === false && user !== null,
  });

  useEffect(() => {
    if (!isLoading && data && user) {
      setProfile(data);
    }

    if (user === null) {
      clearUser();
    }
  }, [data, isLoading, setProfile, clearUser, user]);

  return null;
};
