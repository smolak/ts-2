"use client";

import { UserButton } from "@clerk/nextjs";
import { User as UserIcon } from "lucide-react";

export const User = () => {
  return (
    <UserButton appearance={{ elements: { avatarBox: "w-10! h-10!" } }}>
      <UserButton.MenuItems>
        <UserButton.Link label="Settings" labelIcon={<UserIcon className="h-4 w-4 p-0" />} href="/settings" />
      </UserButton.MenuItems>
    </UserButton>
  );
};
