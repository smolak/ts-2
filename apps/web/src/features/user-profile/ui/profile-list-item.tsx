import type { UserProfile } from "@repo/db/schema";
import type { YesNo } from "@repo/shared/types";
import { Card } from "@repo/ui/components/card";
import type { FC } from "react";
import { UserImage } from "@/features/user/ui/user-image";
import { FollowingBadge } from "./following-badge.js";
import { FollowsMeBadge } from "./follows-me-badge.js";

export type ProfileListItemProps = {
  username: UserProfile["username"];
  imageUrl: UserProfile["imageUrl"];
  iFollow?: YesNo;
  isFollowingMe?: YesNo;
};

export const ProfileListItem: FC<ProfileListItemProps> = ({ username, imageUrl, isFollowingMe, iFollow }) => {
  return (
    <Card className="flex items-stretch gap-4 p-1 hover:bg-slate-50 md:p-2">
      <UserImage username={username} imageUrl={imageUrl} className="row-span-2" />
      <div className="flex flex-col justify-around gap-1 md:flex-row md:items-center md:gap-4">
        <span className="font-medium max-md:text-sm">@{username}</span>
        {(isFollowingMe === "yes" || iFollow === "yes") && (
          <div className="flex gap-2">
            {isFollowingMe === "yes" && <FollowsMeBadge />}
            {iFollow === "yes" && <FollowingBadge />}
          </div>
        )}
      </div>
    </Card>
  );
};
