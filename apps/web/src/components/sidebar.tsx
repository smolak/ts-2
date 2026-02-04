"use client";

import { cn } from "@repo/ui/lib/utils";
import { CircleQuestionMark, Home, Layers, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WEB_APP_BASE_URL } from "@/lib/constants";

export const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/app/profile", icon: User, label: "Profile" },
    { href: "/app/settings", icon: Settings, label: "Settings" },
    { href: "/app/faq#how-to-add-links", icon: CircleQuestionMark, label: "How to add links?" },
  ];

  console.log(pathname);

  return (
    <aside className="min-h-screen w-64 bg-sidebar p-6">
      <div className="fixed top-5 w-52">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-5 w-5 text-lead" />
            <h1 className="font-bold text-xl">LinkDeck</h1>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const linkPath = new URL(link.href, WEB_APP_BASE_URL).pathname;

            const isActive = pathname === linkPath || (link.href !== "/" && pathname.startsWith(linkPath));
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
