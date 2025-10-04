import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import { FC } from "react";

type FollowingBadgeProps = {
  className?: string;
};

export const FollowingBadge: FC<FollowingBadgeProps> = ({ className }) => (
  <Badge className={cn("py-0 font-normal", className)} variant="secondary">
    Following
  </Badge>
);
