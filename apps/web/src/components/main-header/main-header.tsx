import type { User } from "@repo/db/types";
import { ThemeToggle } from "@/features/theme/ui/toggle";
import { LoggedInUserMenu } from "./logged-in-user-menu";
import { LoggedOutUserMenu } from "./logged-out-user-menu";
import { MainMenu } from "./main-menu";

export const MainHeader = async ({ user }: { user: User | null }) => {
  return (
    <header className="supports-backdrop-blur:bg-background/60 bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container flex h-14 items-center place-self-center px-4 sm:h-16 sm:px-8">
        <div className="flex items-center space-x-4 sm:space-x-8">
          <MainMenu />
        </div>

        <aside className="flex flex-1 items-center justify-end">
          <div>
            <div className="flex h-14 items-center justify-center gap-2">
              {user ? <LoggedInUserMenu /> : <LoggedOutUserMenu />}
              <ThemeToggle />
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
};
