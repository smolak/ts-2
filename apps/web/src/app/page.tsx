"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/button";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import type { ReactNode } from "react";
import { SignedInLayout } from "@/components/signed-in-layout";
import { SignedOutLayout } from "@/components/signed-out-layout";
import { LoggedInUserContent } from "@/features/home-page/logged-in-user-content";

export default function Page(): ReactNode {
  return (
    <>
      <SignedIn>
        <SignedInLayout>
          <LoggedInUserContent />
        </SignedInLayout>
      </SignedIn>
      <SignedOut>
        <SignedOutLayout>
          <main className="flex flex-row justify-center">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-center">Sign in to your account</CardTitle>
                <CardDescription className="text-center">Or sign up, if you haven't yet.</CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-row gap-2">
                <SignInButton>
                  <Button variant="outline" className="grow cursor-pointer">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button type="submit" className="grow cursor-pointer">
                    Sign up
                  </Button>
                </SignUpButton>
              </CardFooter>
            </Card>
          </main>
        </SignedOutLayout>
      </SignedOut>
    </>
  );
}
