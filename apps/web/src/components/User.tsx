"use client";

import { UserButton, useUser } from "@clerk/nextjs";

const DotIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <title>Dot icon</title>
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  );
};

export const User = () => {
  const { user } = useUser();

  return (
    <UserButton appearance={{ elements: { avatarBox: "w-10! h-10!" } }}>
      <UserButton.MenuItems>
        <UserButton.Action
          label="Open chat"
          labelIcon={<DotIcon />}
          onClick={() => alert(`Hello, ${user?.firstName}!`)}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
};
