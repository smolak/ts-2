import { cn } from "@repo/ui/lib/utils";
import type { FC, PropsWithChildren } from "react";

type SubmitButtonProps = {
  isSubmitting: boolean;
  className?: string;
};

export const SubmitButton: FC<PropsWithChildren<SubmitButtonProps>> = ({ children, className, isSubmitting }) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn("flex h-[32px] w-[32px] items-center justify-center rounded-md", className)}
    >
      {children}
    </button>
  );
};
