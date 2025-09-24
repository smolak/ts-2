import { Loader2, type LucideProps } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/utils";

interface LoadingIndicatorProps {
  label: string;
  size?: LucideProps["size"];
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ label, size, className }) => {
  return <Loader2 className={cn("animate-spin cursor-progress", className)} aria-label={label} size={size} />;
};
