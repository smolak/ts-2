"use client";

import { schema } from "@workspace/db/db";
import { UserProfile } from "@workspace/db/types";
import { Button } from "@workspace/ui/components/button";
import { LoadingIndicator } from "@workspace/ui/components/loading-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { UserMinus, UserPlus } from "lucide-react";
import { FC, useEffect, useState } from "react";

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
  }, [isDoneChecking, isFollowingCheck]);

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
