import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import type { Deck, UserProfile } from "@repo/db/types";

import { protectedProcedure } from "@/server/api/trpc";

type FollowedDeckItem = {
  id: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  metadata: DeckMetadata;
  urlsCount: Deck["urlsCount"];
  owner: {
    username: UserProfile["username"];
    imageUrl: UserProfile["imageUrl"];
  };
};

type GetFollowedDecksResult = FollowedDeckItem[];

export const getFollowedDecks = protectedProcedure.query<GetFollowedDecksResult>(
  async ({ ctx: { logger, requestId, db, userId } }) => {
    const path = "deck.getFollowedDecks";

    logger.info({ requestId, path, userId }, "Fetching followed decks.");

    const followedDecks = await db.query.deckFollows.findMany({
      where: (follows, { eq }) => eq(follows.followerId, userId),
      with: {
        deck: {
          columns: {
            id: true,
            name: true,
            slug: true,
            metadata: true,
            urlsCount: true,
            userId: true,
            scheduledForDeletionAt: true,
          },
        },
      },
      orderBy: (follows, { desc }) => [desc(follows.createdAt)],
    });

    // Filter out pending-deletion decks
    const activeFollowedDecks = followedDecks.filter((f) => !f.deck.scheduledForDeletionAt);

    // Get owner profiles for the decks
    const ownerIds = [...new Set(activeFollowedDecks.map((f) => f.deck.userId))];

    const ownerProfiles = await db.query.userProfiles.findMany({
      where: (profiles, { inArray }) => inArray(profiles.userId, ownerIds),
      columns: { userId: true, username: true, imageUrl: true },
    });

    const profileMap = new Map(ownerProfiles.map((p) => [p.userId, p]));

    logger.info({ requestId, path, userId, count: activeFollowedDecks.length }, "Followed decks fetched.");

    return activeFollowedDecks.map((f) => {
      const owner = profileMap.get(f.deck.userId);
      return {
        id: f.deck.id,
        name: f.deck.name,
        slug: f.deck.slug,
        metadata: f.deck.metadata as DeckMetadata,
        urlsCount: f.deck.urlsCount,
        owner: {
          username: owner?.username ?? "Unknown",
          imageUrl: owner?.imageUrl ?? null,
        },
      };
    });
  },
);
