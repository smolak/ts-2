import type { User, UserProfile } from "@workspace/db/types";
import { createStore } from "zustand/vanilla";

export type UserState =
  | {
      loggedIn: true;
      profile: {
        id: User["id"];
        username: UserProfile["username"];
        imageUrl: UserProfile["imageUrl"];
      };
    }
  | {
      loggedIn: false;
      profile: undefined;
    };

export type UserActions = {
  setProfile: (userProfile: UserState["profile"]) => void;
  clearUser: () => void;
};

export type UserStore = UserState & UserActions;

export const initUserStore = (): UserState => defaultInitState;

export const defaultInitState: UserState = {
  loggedIn: false,
  profile: undefined,
};

export const createUserStore = (initState: UserState = defaultInitState) => {
  return createStore<UserStore>()((set) => ({
    ...initState,
    setProfile: (userProfile: UserState["profile"]) =>
      set((state) => ({ ...state, profile: userProfile, loggedIn: true })),
    clearUser: () => set(() => defaultInitState),
  }));
};
