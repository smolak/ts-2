import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PublicDecksGrid } from "@/features/deck/ui/public-decks-grid";
import { InfiniteUserFeed } from "@/features/feed/ui/user-feed-list/infinite-user-feed";
import { UserProfileCard } from "@/features/user-profile/ui/user-profile-card";
import { api } from "@/trpc/server";

export default async function Page({ params }: { params: Promise<{ username: string }> }): Promise<ReactNode> {
  const { username } = await params;
  const parseResult = usernameSchema.safeParse(username);

  if (!parseResult.success) {
    notFound();
  }

  // Fetch user profile and public decks in parallel
  const [userProfile, publicDecksResult] = await Promise.all([
    api.userProfiles.getPublicUserProfile({ username }),
    api.decks.getPublicDecks({ username }),
  ]);

  if (!userProfile || !publicDecksResult) {
    notFound();
  }

  const { decks } = publicDecksResult;

  return (
    <>
      <div className="inline-block w-1/4">Left</div>
      <div className="inline-block w-1/2">
        <main>
          <div className="flex items-center justify-center">
            <div className="flex flex-col gap-6">
              {/* Public Decks Grid */}
              <PublicDecksGrid decks={decks} username={userProfile.username} />

              <div className="flex flex-col gap-2">
                <InfiniteUserFeed userId={userProfile.id} viewerId={undefined} />
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="inline-block w-1/4">
        <UserProfileCard publicUserProfileData={userProfile} />
      </div>
    </>
  );
}
