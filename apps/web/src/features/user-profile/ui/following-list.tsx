import type { UserProfile } from "@repo/db/types";
import Link from "next/link";
import type { FC } from "react";

import { ProfileListItem, type ProfileListItemProps } from "./profile-list-item.js";

type FollowingFollowersListProps = {
  username: UserProfile["username"];
  profiles: ReadonlyArray<ProfileListItemProps>;
  myProfile?: boolean;
};

export const FollowingList: FC<FollowingFollowersListProps> = ({ username, profiles, myProfile }) => {
  return (
    <section className="lg:min-h-[350px]">
      <h1 className="mb-5 font-bold text-lg">{myProfile ? "Profiles I follow" : `Profiles ${username} follows`}</h1>
      <ol className="flex flex-col gap-1.5">
        {profiles.map((profile) => {
          return (
            <li key={profile.username}>
              <Link href={`/${profile.username}`}>
                <ProfileListItem {...profile} />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
