import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { FC } from "react";

type FollowsMeBadgeProps = {
  className?: string;
};

export const FollowsMeBadge: FC<FollowsMeBadgeProps> = ({ className }) => (
  <Badge className={cn("py-0 font-normal", className)} variant="secondary">
    Follows me
  </Badge>
);
