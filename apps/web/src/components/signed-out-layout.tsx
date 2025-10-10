import type { FC, PropsWithChildren } from "react";
import { ThemeSwitcher } from "./theme-switcher";

export const SignedOutLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <main className="mx-auto max-w-3xl flex-1 px-8 py-8">
        <div className="mb-6 flex items-center justify-center">
          <h1 className="font-bold text-2xl">Welcome to SITE NAME</h1>
        </div>
        {children}
      </main>
      <aside className="fixed right-0 w-80 space-y-6 p-8">
        <div className="flex flex-row items-center justify-end gap-8">
          <ThemeSwitcher />
        </div>
      </aside>
    </>
  );
};
