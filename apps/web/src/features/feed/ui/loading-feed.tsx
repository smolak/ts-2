import { LoadingIndicator } from "@workspace/ui/components/loading-indicator";
import { FC } from "react";

export const LoadingFeed: FC = () => {
  return (
    <div className="flex justify-center p-20">
      <LoadingIndicator label="Loading feed..." />
    </div>
  );
};
