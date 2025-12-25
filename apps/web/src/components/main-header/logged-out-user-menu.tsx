"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@repo/ui/components/button";

export const LoggedOutUserMenu = () => {
  return (
    <div className="flex items-center gap-2">
      <SignInButton>
        <Button variant="ghost" size="sm" className="cursor-pointer">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton>
        <Button size="sm" className="cursor-pointer">
          Sign up
        </Button>
      </SignUpButton>
    </div>
  );
};

