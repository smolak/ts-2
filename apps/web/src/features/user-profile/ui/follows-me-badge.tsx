import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import type { FC } from "react";

type FollowsMeBadgeProps = {
  className?: string;
};

export const FollowsMeBadge: FC<FollowsMeBadgeProps> = ({ className }) => (
  <Badge className={cn("py-0 font-normal", className)} variant="secondary">
    Follows me
  </Badge>
);
