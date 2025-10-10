import type { FC, PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";
import { ThemeSwitcher } from "./theme-switcher";
import { User } from "./user";

export const SignedInLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Sidebar />
      <main className="mx-auto max-w-3xl flex-1 px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-bold text-2xl">Your Feed</h1>
        </div>
        {children}
      </main>
      <aside className="w-80 space-y-6 p-8">
        <div className="flex flex-row items-center justify-end gap-8">
          <ThemeSwitcher />
          <User />
        </div>
      </aside>
    </>
  );
};
