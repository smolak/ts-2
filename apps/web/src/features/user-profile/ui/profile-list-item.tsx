import { schema } from "@workspace/db/db";
import { type YesNo } from "@workspace/shared/types";

import { FC } from "react";

import { FollowingBadge } from "./following-badge.js";
import { FollowsMeBadge } from "./follows-me-badge.js";
import { Card } from "@workspace/ui/components/card";
import { UserImage } from "@/modules/user/ui/user-image.jsx";

export type ProfileListItemProps = {
  username: schema.UserProfile["username"];
  imageUrl: schema.UserProfile["imageUrl"];
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
