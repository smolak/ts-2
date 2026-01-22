import type { FC, PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";
import { ThemeSwitcher } from "./theme-switcher";
import { UserButton } from "./user-button";

export const SignedInLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto max-w-3xl flex-1 px-8 py-8">{children}</main>
      <aside className="w-80 space-y-6 p-8">
        <div className="fixed right-8 flex flex-row items-center justify-end gap-8">
          <ThemeSwitcher />
          <UserButton />
        </div>
      </aside>
    </div>
  );
};
