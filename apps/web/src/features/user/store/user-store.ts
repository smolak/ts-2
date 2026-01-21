import type { Maybe } from "@repo/shared/types";
import { createStore } from "zustand/vanilla";
import type { PrivateUserProfileDto } from "@/features/user-profile/dto/private-user-profile.dto";

export type UserState = {
  isSignedIn: boolean;
  isProfileComplete: boolean;
  profile: Maybe<PrivateUserProfileDto>;
};

export type UserActions = {
  setProfile: (userProfile: UserState["profile"]) => void;
  setIsSignedIn: (isSignedIn: UserState["isSignedIn"]) => void;
  setIsProfileComplete: (isProfileComplete: UserState["isProfileComplete"]) => void;
  clearUserState: () => void;
};

export type UserStore = UserState & UserActions;

export const initUserStore = (): UserState => defaultInitState;

export const defaultInitState: UserState = {
  isSignedIn: false,
  isProfileComplete: false,
  profile: null,
};

export const createUserStore = (initState: UserState = defaultInitState) => {
  return createStore<UserStore>()((set) => ({
    ...initState,
    setProfile: (userProfile) => set((state) => ({ ...state, profile: userProfile })),
    setIsSignedIn: (isSignedIn) => set((state) => ({ ...state, isSignedIn })),
    setIsProfileComplete: (isProfileComplete) => set((state) => ({ ...state, isProfileComplete })),
    clearUserState: () => set(() => defaultInitState),
  }));
};
