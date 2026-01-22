"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { SignedInLayout } from "@/components/signed-in-layout";
import { WelcomeHomepageScreen } from "@/components/welcome-homepage-screen";
import { LoggedInUserContent } from "@/features/home-page/logged-in-user-content";
import { UserStoreProvider } from "@/features/user/store/user-store-provider";

export default function Page(): ReactNode {
  return (
    <>
      <SignedIn>
        <UserStoreProvider>
          <SignedInLayout>
            <LoggedInUserContent />
          </SignedInLayout>
        </UserStoreProvider>
      </SignedIn>
      <SignedOut>
        <WelcomeHomepageScreen />
      </SignedOut>
    </>
  );
}
