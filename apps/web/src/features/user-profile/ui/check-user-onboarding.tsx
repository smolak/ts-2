"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardAction, CardContent, CardFooter, CardHeader } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { Layers } from "lucide-react";
import type { FC, PropsWithChildren } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NewUserProfileForm } from "./new-user-profile-form";

export const CheckUserOnboarding: FC<PropsWithChildren> = ({ children }) => {
  const { isSignedIn, user } = useUser();

  if (isSignedIn && user.publicMetadata.appUserId === undefined) {
    return (
      <main className="mx-auto max-w-4xl flex-1 px-8 py-8">
        <Card className="w-full">
          <CardHeader>
            <h1 className="flex gap-2 text-4xl">
              Welcome to{" "}
              <span className="flex items-center">
                <Layers className="h-7 w-7 text-lead" />
                <span className="font-bold">LinkDeck</span>
              </span>
            </h1>
            <CardAction>
              <ThemeSwitcher />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Thank you for signing up!</p>
            <p>Just before you continue, we need you to finish creating your profile.</p>
          </CardContent>
          <Separator />
          <CardFooter>
            <NewUserProfileForm className="w-full" />
          </CardFooter>
        </Card>
      </main>
    );
  }

  return children;
};
