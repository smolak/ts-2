"server-only";

import { Separator } from "@repo/ui/components/separator";
import type { ReactElement } from "react";

import { completeUserProfileSchema } from "@/features/user-profile/schemas/complete-user-profile.schema";
import { ExistingUserProfileForm } from "@/features/user-profile/ui/existing-user-profile-form";
import { NewUserProfileForm } from "@/features/user-profile/ui/new-user-profile-form";
import { api } from "@/trpc/server";

export default async function Page(): Promise<ReactElement> {
  const maybeCompletePrivateUserProfile = await api.userProfiles.getPrivateUserProfile();
  const completeUserProfile = completeUserProfileSchema.safeParse(maybeCompletePrivateUserProfile);

  if (completeUserProfile.success) {
    return (
      <section className="space-y-6">
        <header className="space-y-1">
          <h3 className="font-medium text-xl tracking-tight">Profile settings</h3>
          <h4 className="font-light text-gray-500 text-sm">Manage your profile settings here.</h4>
        </header>
        <Separator className="md:max-w-[450px]" />
        <ExistingUserProfileForm {...completeUserProfile.data} />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <NewUserProfileForm />
    </section>
  );
}
