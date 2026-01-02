import type { Deck, UserProfile } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import type { Maybe } from "@repo/shared/types";
import { z } from "zod";

import { publicProcedure } from "@/server/api/trpc";

const getPublicDecksSchema = z.object({
  username: z.string().min(1),
});

export type GetPublicDecksSchema = z.infer<typeof getPublicDecksSchema>;

type PublicDeckItem = {
  id: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  metadata: DeckMetadata;
  urlsCount: Deck["urlsCount"];
  followersCount: Deck["followersCount"];
};

type GetPublicDecksResult = Maybe<{
  decks: PublicDeckItem[];
  owner: {
    username: UserProfile["username"];
    imageUrl: UserProfile["imageUrl"];
  };
}>;

export const getPublicDecks = publicProcedure
  .input(getPublicDecksSchema)
  .query<GetPublicDecksResult>(async ({ input: { username }, ctx: { logger, requestId, db } }) => {
    const path = "deck.getPublicDecks";

    logger.info({ requestId, path, username }, "Fetching public decks for user.");

    // 1. Find the user profile by username
    const userProfile = await db.query.userProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.usernameNormalized, username.toLowerCase()),
      columns: { userId: true, username: true, imageUrl: true },
    });

    if (!userProfile) {
      logger.info({ requestId, path, username }, "User profile not found.");
      return null;
    }

    // 2. Get all public decks for this user (excluding pending-deletion decks)
    const decks = await db.query.decks.findMany({
      where: (decks, { and, eq, isNull }) =>
        and(eq(decks.userId, userProfile.userId), eq(decks.isPublic, true), isNull(decks.scheduledForDeletionAt)),
      columns: {
        id: true,
        name: true,
        slug: true,
        metadata: true,
        urlsCount: true,
        followersCount: true,
      },
      orderBy: (decks, { desc }) => [desc(decks.createdAt)],
    });

    logger.info({ requestId, path, username, count: decks.length }, "Public decks fetched.");

    return {
      decks: decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        slug: deck.slug,
        metadata: deck.metadata as DeckMetadata,
        urlsCount: deck.urlsCount,
        followersCount: deck.followersCount,
      })),
      owner: {
        username: userProfile.username,
        imageUrl: userProfile.imageUrl,
      },
    };
  });
