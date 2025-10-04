import { db } from "@workspace/db/db";
import { type UserProfile } from "@workspace/db/types";
import { usernameSchema } from "@workspace/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@workspace/user-profile/utils/normalize-username";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { CategoriesSelector } from "@/features/category/ui/categories-selector";
import { InfiniteUserFeed } from "@/features/feed/ui/user-feed-list/infinite-user-feed";
import { toPublicUserProfileVM } from "@/features/user-profile/models/public-user-profile.vm";
import { UserProfileCard } from "@/features/user-profile/ui/user-profile-card";
import { createClient } from "@/supabase/utils/server";

export default async function Page({
  params,
}: {
  params: Promise<{ username: UserProfile["username"] }>;
}): Promise<ReactNode> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { username } = await params;
  const parseResult = usernameSchema.safeParse(username);

  if (!parseResult.success) {
    notFound();
  }

  const maybeUserProfile = await db.query.userProfiles.findFirst({
    where: (userProfiles, { eq }) => eq(userProfiles.usernameNormalized, normalizeUsername(username)),
  });

  if (!maybeUserProfile) {
    notFound();
  }

  const userProfile = toPublicUserProfileVM(maybeUserProfile);
  const categories = await db.query.categories.findMany({
    where: (categories, { eq }) => eq(categories.userId, userProfile.id),
    orderBy: (categories, { asc }) => asc(categories.name),
  });

  const canFollow = Boolean(user?.id) && userProfile.id !== user?.id;

  return (
    <>
      <div className="inline-block w-1/4">Left</div>
      <div className="inline-block w-1/2">
        <main>
          <div className="flex items-center justify-center">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-7">
                <aside className="flex justify-between">
                  <CategoriesSelector author={userProfile.username} categories={categories} />
                </aside>
              </div>
              <div className="flex flex-col gap-2">
                <InfiniteUserFeed userId={userProfile.id} viewerId={user?.id} />
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="inline-block w-1/4">
        <UserProfileCard publicUserProfileData={userProfile} canFollow={canFollow} />
      </div>
    </>
  );
}
