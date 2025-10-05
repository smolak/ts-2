import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import type { FC } from "react";

type FollowingBadgeProps = {
  className?: string;
};

export const FollowingBadge: FC<FollowingBadgeProps> = ({ className }) => (
  <Badge className={cn("py-0 font-normal", className)} variant="secondary">
    Following
  </Badge>
);
