import { deckSlugSchema } from "@repo/deck/schemas/deck-slug.schema";
import type { Deck, UserProfile, User } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import { z } from "zod";

import { publicProcedure } from "@/server/api/trpc";

const getDeckBySlugSchema = z.object({
  username: z.string().min(1),
  slug: deckSlugSchema,
});

export type GetDeckBySlugSchema = z.infer<typeof getDeckBySlugSchema>;

type GetDeckBySlugResult = {
  id: Deck["id"];
  name: Deck["name"];
  slug: Deck["slug"];
  metadata: DeckMetadata;
  urlsCount: Deck["urlsCount"];
  followersCount: Deck["followersCount"];
  owner: {
    userId: User["id"];
    username: UserProfile["username"];
    imageUrl: UserProfile["imageUrl"];
  };
  isFollowing: boolean;
} | null;

export const getDeckBySlug = publicProcedure
  .input(getDeckBySlugSchema)
  .query<GetDeckBySlugResult>(async ({ input: { username, slug }, ctx: { logger, requestId, db, auth } }) => {
    const path = "deck.getDeckBySlug";

    logger.info({ requestId, path, username, slug }, "Fetching deck by slug.");

    // 1. Find the user profile by username
    const userProfile = await db.query.userProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.usernameNormalized, username.toLowerCase()),
      columns: { userId: true, username: true, imageUrl: true },
    });

    if (!userProfile) {
      logger.info({ requestId, path, username }, "User profile not found.");
      return null;
    }

    // 2. Get the current viewer's userId (if authenticated)
    let viewerUserId: string | null = null;

    if (auth.userId) {
      const viewer = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkUserId, auth.userId!),
        columns: { id: true },
      });
      
      viewerUserId = viewer?.id ?? null;
    }

    const isOwner = viewerUserId === userProfile.userId;

    // 3. Find the deck
    const deck = await db.query.decks.findFirst({
      where: (decks, { and, eq }) => and(eq(decks.userId, userProfile.userId), eq(decks.slug, slug)),
    });

    if (!deck) {
      logger.info({ requestId, path, username, slug }, "Deck not found.");
      return null;
    }

    // 4. Check visibility - only owner can see private decks
    if (!deck.isPublic && !isOwner) {
      logger.info({ requestId, path, username, slug }, "Deck is private and viewer is not owner.");
      return null;
    }

    // 5. Hide pending-deletion decks from non-owners
    if (deck.scheduledForDeletionAt && !isOwner) {
      logger.info({ requestId, path, username, slug }, "Deck is pending deletion and viewer is not owner.");
      return null;
    }

    // 6. Check if viewer is following this deck
    let isFollowing = false;
    if (viewerUserId && !isOwner) {
      const follow = await db.query.deckFollows.findFirst({
        where: (follows, { and, eq }) =>
          and(eq(follows.deckId, deck.id), eq(follows.followerId, viewerUserId!)),
        columns: { deckId: true },
      });
      isFollowing = !!follow;
    }

    logger.info({ requestId, path, deckId: deck.id }, "Deck fetched.");

    return {
      id: deck.id,
      name: deck.name,
      slug: deck.slug,
      metadata: deck.metadata as DeckMetadata,
      urlsCount: deck.urlsCount,
      followersCount: deck.followersCount,
      owner: {
        userId: userProfile.userId,
        username: userProfile.username,
        imageUrl: userProfile.imageUrl,
      },
      isFollowing,
    };
  });

