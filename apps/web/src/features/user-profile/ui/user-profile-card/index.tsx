"use client";

import type { UserProfile } from "@workspace/db/types";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FC, useState } from "react";

import { ToggleFollowUser } from "@/features/follow-user/ui/toggle-follow-user";
import { UserImage } from "@/features/user/ui/user-image";

import type { PublicUserProfileVM } from "../../dto/public-user-profile.dto";
import { DataElement } from "./data-element";

interface UserProfileCardProps {
  publicUserProfileData: PublicUserProfileVM;
  canFollow?: boolean;
}

export const UserProfileCard: FC<UserProfileCardProps> = ({ publicUserProfileData, canFollow = false }) => {
  const pathname = usePathname();
  const { id, username, imageUrl, followingCount, likesCount, urlsCount } = publicUserProfileData;
  const [followersCount, setFollowingCount] = useState<UserProfile["followersCount"]>(
    publicUserProfileData.followersCount,
  );

  return (
    <Card className="grid grid-cols-2 rounded-sm py-1.5 md:sticky md:top-[138px] md:block lg:top-36">
      <CardHeader className="md:b-2 p-2">
        <CardTitle className="flex flex-col items-center gap-2 md:pt-7">
          <UserImage
            username={username}
            imageUrl={imageUrl}
            size="big"
            className="hover:ring-0 md:absolute md:-top-9"
          />
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg">@{username}</span>
            {canFollow && <ToggleFollowUser userId={id} onFollowToggle={setFollowingCount} />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-stretch p-2 md:flex-col">
        <div className="md:text-md max-md:flex max-md:flex-col max-md:justify-between md:grid md:grid-cols-2 md:grid-rows-2 md:gap-x-14 md:gap-y-4 md:text-center">
          <Link
            href={`/${username}`}
            className={cn("rounded-sm px-2 py-1", pathname === `/${username}` && "bg-slate-50")}
          >
            <DataElement name="URLs" value={urlsCount} />
          </Link>
          <div className={cn("rounded-sm px-2 py-1", pathname === `/${username}/likes` && "bg-slate-100")}>
            <DataElement name="Likes" value={likesCount} />
          </div>
          <Link
            href={`/${username}/following`}
            className={cn("rounded-sm px-2 py-1", pathname === `/${username}/following` && "bg-slate-100")}
          >
            <DataElement name="Following" value={followingCount} />
          </Link>
          <Link
            href={`/${username}/followers`}
            className={cn("rounded-sm px-2 py-1", pathname === `/${username}/followers` && "bg-slate-100")}
          >
            <DataElement name="Followers" value={followersCount} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
