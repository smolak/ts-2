"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, PropsWithChildren } from "react";

export const CheckUserOnboarding: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  if (isSignedIn && user.publicMetadata.appUserId === undefined && pathname !== "/settings/profile") {
    return (
      <div>
        Welcome to [PROJECT NAME]. Before you can start using the app, you need to finish creating your profile. Head
        over to:
        <Link href="/settings/profile">Profile Settings</Link>.
      </div>
    );
  }

  return children;
};
