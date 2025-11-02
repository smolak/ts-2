import { db } from "@repo/db/db";
import type { UserProfile } from "@repo/db/types";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@repo/user-profile/utils/normalize-username";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CategoriesSelector } from "@/features/category/ui/categories-selector";
import { InfiniteUserFeed } from "@/features/feed/ui/user-feed-list/infinite-user-feed";
import { toPublicUserProfileDto } from "@/features/user-profile/dto/public-user-profile.dto";
import { UserProfileCard } from "@/features/user-profile/ui/user-profile-card";

export default async function Page({
  params,
}: {
  params: Promise<{ username: UserProfile["username"] }>;
}): Promise<ReactNode> {
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

  const userProfile = toPublicUserProfileDto(maybeUserProfile);
  const categories = await db.query.categories.findMany({
    where: (categories, { eq }) => eq(categories.userId, userProfile.id),
    orderBy: (categories, { asc }) => asc(categories.name),
  });

  const canFollow = true; // Boolean(user?.id) && userProfile.id !== user?.id;

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
                <InfiniteUserFeed userId={userProfile.id} viewerId={undefined} />
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
