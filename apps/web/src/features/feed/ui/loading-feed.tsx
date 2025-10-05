import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import type { FC } from "react";

export const LoadingFeed: FC = () => {
  return (
    <div className="flex justify-center p-20">
      <LoadingIndicator label="Loading feed..." />
    </div>
  );
};
