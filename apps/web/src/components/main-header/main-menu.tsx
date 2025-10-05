"use client";

import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const MainMenu = () => {
  const pathname = usePathname();

  return (
    <nav>
      <ol className="flex items-center space-x-4 text-sm font-medium sm:space-x-6">
        <li>
          <Link
            href="/"
            className={cn(
              pathname === "/" ? "text-primary" : "text-secondary",
              "transition-colors hover:text-slate-800",
            )}
          >
            Homepage
          </Link>
        </li>
        <li>
          <Link
            href="/about"
            className={cn(
              pathname === "/about" ? "text-primary" : "text-secondary",
              "transition-colors hover:text-slate-800",
            )}
          >
            About
          </Link>
        </li>
        <li>
          <Link
            href="/privacy-policy"
            className={cn(
              pathname === "/privacy-policy" ? "text-primary" : "text-secondary",
              "transition-colors hover:text-slate-800",
            )}
          >
            Privacy Policy
          </Link>
        </li>
      </ol>
    </nav>
  );
};
