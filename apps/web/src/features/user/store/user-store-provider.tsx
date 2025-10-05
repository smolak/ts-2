"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

import { createUserStore, initUserStore, type UserStore } from "./user-store";

export type UserStoreApi = ReturnType<typeof createUserStore>;

export const UserStoreContext = createContext<UserStoreApi | undefined>(undefined);

export interface UserStoreProviderProps {
  children: ReactNode;
}

export const UserStoreProvider = ({ children }: UserStoreProviderProps) => {
  const store = useRef<UserStoreApi | null>(null);

  if (!store.current) {
    store.current = createUserStore(initUserStore());
  }

  return <UserStoreContext.Provider value={store.current}>{children}</UserStoreContext.Provider>;
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const userStoreContext = useContext(UserStoreContext);

  if (!userStoreContext) {
    throw new Error("useUserStore must be used within a UserStoreProvider");
  }

  return useStore(userStoreContext, selector);
};
