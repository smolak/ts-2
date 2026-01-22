"use client";

import { cn } from "@repo/ui/lib/utils";
import { Home, Layers, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/app/profile", icon: User, label: "Profile" },
    { href: "/app/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="min-h-screen w-64 bg-sidebar p-6">
      <div className="fixed top-5 w-52">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-accent">
              <Layers className="h-5 w-5 text-accent" />
            </span>
            <h1 className="font-bold text-xl">LinkDeck</h1>
          </div>
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
      </div>
    </aside>
  );
};
