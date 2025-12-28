import { Separator } from "@repo/ui/components/separator";
import { Layers, User } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const settingsLinks = [
    {
      href: "/settings/profile",
      icon: User,
      label: "Profile",
      description: "Manage your public profile information",
    },
    {
      href: "/settings/decks",
      icon: Layers,
      label: "Decks",
      description: "Create and manage your curated link collections",
    },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h3 className="font-medium text-xl tracking-tight">Settings</h3>
        <h4 className="font-light text-gray-500 text-sm">Manage your account and preferences.</h4>
      </header>
      <Separator className="md:max-w-[450px]" />
      <nav className="flex flex-col gap-2 md:max-w-[450px]">
        {settingsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 rounded-md border p-4 transition-colors hover:bg-slate-50"
          >
            <link.icon size={20} className="text-slate-600" />
            <div className="flex flex-col">
              <span className="font-medium">{link.label}</span>
              <span className="text-slate-500 text-sm">{link.description}</span>
            </div>
          </Link>
        ))}
      </nav>
    </section>
  );
}
