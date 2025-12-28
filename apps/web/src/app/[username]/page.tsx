import { db } from "@repo/db/db";
import type { UserProfile } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import { normalizeUsername } from "@repo/user-profile/utils/normalize-username";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PublicDecksGrid } from "@/features/deck/ui/public-decks-grid";
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

  // Fetch public decks
  const publicDecks = await db.query.decks.findMany({
    where: (decks, { and, eq, isNull }) =>
      and(eq(decks.userId, userProfile.id), eq(decks.isPublic, true), isNull(decks.scheduledForDeletionAt)),
    orderBy: (decks, { desc }) => desc(decks.createdAt),
  });

  const formattedDecks = publicDecks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    slug: deck.slug,
    metadata: deck.metadata as DeckMetadata,
    urlsCount: deck.urlsCount,
    followersCount: deck.followersCount,
  }));

  return (
    <>
      <div className="inline-block w-1/4">Left</div>
      <div className="inline-block w-1/2">
        <main>
          <div className="flex items-center justify-center">
            <div className="flex flex-col gap-6">
              {/* Public Decks Grid */}
              <PublicDecksGrid decks={formattedDecks} username={userProfile.username} />

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
