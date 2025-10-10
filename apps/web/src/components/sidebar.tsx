"use client";

import { cn } from "@repo/ui/lib/utils";
import { Home, Link as LinkIcon, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();
  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/@johndoe", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="sticky top-0 min-h-screen w-64 bg-sidebar p-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <LinkIcon className="h-6 w-6 text-primary" />
          <h1 className="font-bold text-xl">LinkShare</h1>
        </div>
        <p className="text-muted-foreground text-xs">Share what inspires you</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
