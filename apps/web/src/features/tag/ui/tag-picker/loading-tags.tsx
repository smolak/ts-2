import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { cn } from "@repo/ui/lib/utils";
import type { FC } from "react";

type Size = "default" | "small";
type Variant = "default" | "light";

type LoadingTagsProps = {
  className?: string;
  size?: Size;
  variant?: Variant;
};

export const LoadingTags: FC<LoadingTagsProps> = ({ className, size, variant }) => {
  return (
    <div className={cn("flex justify-center", className)}>
      <LoadingIndicator
        label="Loading your tags..."
        className={cn({ "h-4 w-4": size === "small", "text-slate-400": variant === "light" })}
      />
    </div>
  );
};
