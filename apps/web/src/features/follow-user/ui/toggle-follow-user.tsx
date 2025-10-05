"use client";

import type { schema } from "@repo/db/db";
import type { UserProfile } from "@repo/db/schema";
import { Button } from "@repo/ui/components/button";
import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { UserMinus, UserPlus } from "lucide-react";
import { type FC, useEffect, useState } from "react";

import { api } from "@/trpc/react";

interface ToggleFollowUserProps {
  userId: schema.User["id"];
  onFollowToggle?: (followersCount: UserProfile["followersCount"]) => void;
}

export const ToggleFollowUser: FC<ToggleFollowUserProps> = ({ userId, onFollowToggle }) => {
  const { data: isFollowingCheck, isSuccess: isDoneChecking } = api.followUser.isFollowingUser.useQuery({ userId });
  const [isFollowing, setIsFollowing] = useState<boolean>();

  const utils = api.useUtils();

  useEffect(() => {
    setIsFollowing(isFollowingCheck);
  }, [isFollowingCheck]);

  const { mutate: toggle, isPending: isToggling } = api.followUser.toggleFollowUser.useMutation({
    onSuccess(input) {
      setIsFollowing(input.status === "following");
      onFollowToggle?.(input.followersCount);

      utils.followUser.isFollowingUser.invalidate({ userId: input.userId });
    },
  });

  if (!isDoneChecking) {
    return <LoadingIndicator label="Checking follow status" />;
  }

  if (isFollowing) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button
              className="flex items-center gap-2"
              variant="outline"
              onClick={() => toggle({ userId })}
              disabled={isToggling}
            >
              Following
              {isToggling ? (
                <LoadingIndicator size={14} label="Unfollowing..." />
              ) : (
                <UserMinus size={14} aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Unfollow</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button className="flex items-center gap-2" onClick={() => toggle({ userId })} disabled={isToggling}>
      Follow
      {isToggling ? <LoadingIndicator size={14} label="Following..." /> : <UserPlus size={14} aria-hidden="true" />}
    </Button>
  );
};
