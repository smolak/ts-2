import type { Deck, User, UserProfile } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import { deckSlugSchema } from "@repo/deck/schemas/deck-slug.schema";
import type { Maybe } from "@repo/shared/types";
import { z } from "zod";

import { publicProcedure } from "@/server/api/trpc";

const getDeckBySlugSchema = z.object({
  username: z.string().min(1),
  slug: deckSlugSchema,
});

export type GetDeckBySlugSchema = z.infer<typeof getDeckBySlugSchema>;

type GetDeckBySlugResult = Maybe<{
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
}>;

export const getDeckBySlug = publicProcedure
  .input(getDeckBySlugSchema)
  .query<GetDeckBySlugResult>(async ({ input: { username, slug }, ctx: { logger, requestId, db, auth } }) => {
    const path = "deck.getDeckBySlug";

    logger.info({ requestId, path, username, slug }, "Fetching deck by slug.");

    // 1. Fetch user profile and viewer in parallel (independent queries)
    const [userProfile, viewer] = await Promise.all([
      db.query.userProfiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.usernameNormalized, username.toLowerCase()),
        columns: { userId: true, username: true, imageUrl: true },
      }),
      auth.userId
        ? db.query.users.findFirst({
            where: (users, { eq }) => eq(users.clerkUserId, auth.userId),
            columns: { id: true },
          })
        : Promise.resolve(undefined),
    ]);

    if (!userProfile) {
      logger.info({ requestId, path, username }, "User profile not found.");
      return null;
    }

    const viewerUserId = viewer?.id ?? null;
    const isOwner = viewerUserId === userProfile.userId;

    // 2. Find the deck (only select needed columns)
    const deck = await db.query.decks.findFirst({
      where: (decks, { and, eq }) => and(eq(decks.userId, userProfile.userId), eq(decks.slug, slug)),
      columns: {
        id: true,
        name: true,
        slug: true,
        metadata: true,
        urlsCount: true,
        followersCount: true,
        isPublic: true,
        scheduledForDeletionAt: true,
      },
    });

    if (!deck) {
      logger.info({ requestId, path, username, slug }, "Deck not found.");
      return null;
    }

    // 3. Check visibility - only owner can see private decks
    if (!deck.isPublic && !isOwner) {
      logger.info({ requestId, path, username, slug }, "Deck is private and viewer is not owner.");
      return null;
    }

    // 4. Hide pending-deletion decks from non-owners
    if (deck.scheduledForDeletionAt && !isOwner) {
      logger.info({ requestId, path, username, slug }, "Deck is pending deletion and viewer is not owner.");
      return null;
    }

    // 5. Check if viewer is following this deck
    let isFollowing = false;
    if (viewerUserId && !isOwner) {
      const follow = await db.query.deckFollows.findFirst({
        where: (follows, { and, eq }) => and(eq(follows.deckId, deck.id), eq(follows.followerId, viewerUserId)),
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
