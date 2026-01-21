import { Separator } from "@repo/ui/components/separator";
import type { ReactElement } from "react";

import { DecksSettings } from "@/features/deck/ui/settings";
import { api } from "@/trpc/server";

export default async function Page(): Promise<ReactElement> {
  const privateUserProfile = await api.userProfiles.getPrivateUserProfile();

  if (!privateUserProfile) {
    return (
      <section className="space-y-6">
        <header className="space-y-1">
          <h3 className="font-medium text-xl tracking-tight">Decks</h3>
          <h4 className="font-light text-gray-500 text-sm">User profile not found.</h4>
        </header>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h3 className="font-medium text-xl tracking-tight">Decks</h3>
        <h4 className="font-light text-gray-500 text-sm">
          Create and manage your decks. Decks are curated collections of URLs that others can follow.
        </h4>
      </header>
      <Separator className="md:max-w-[550px]" />
      <DecksSettings />
    </section>
  );
}
