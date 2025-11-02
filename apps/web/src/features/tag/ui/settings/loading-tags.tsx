import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import type { FC } from "react";

export const LoadingTags: FC = () => {
  return (
    <div className="flex justify-center p-20">
      <LoadingIndicator label="Loading your tags..." />
    </div>
  );
};
