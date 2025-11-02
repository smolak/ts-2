import { Ban } from "lucide-react";
import type { FC } from "react";

export const CancelAction: FC = () => {
  return (
    <span className="group flex h-[31px] w-[31px] items-center justify-center rounded-md hover:bg-gray-100">
      <Ban size={14} />
    </span>
  );
};
