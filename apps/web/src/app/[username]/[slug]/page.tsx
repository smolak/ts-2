import { deckSlugSchema } from "@repo/deck/schemas/deck-slug.schema";
import { normalizeUsername } from "@repo/user-profile/normalized-username/normalized-username";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DeckContent } from "@/features/deck/ui/public-deck/deck-content";
import { DeckHeader } from "@/features/deck/ui/public-deck/deck-header";
import { api, HydrateClient } from "@/trpc/server";

type Params = {
  username: string;
  slug: string;
};

type PageProps = {
  params: Promise<Params>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;

  const normalizedUsername = normalizeUsername(username);
  const deck = await api.decks.getDeckBySlug({ normalizedUsername, slug });

  if (!deck) {
    return {
      title: "Deck Not Found",
    };
  }

  return {
    title: `${deck.name} - @${deck.owner.username}'s Deck`,
    description:
      deck.metadata.description || `Explore ${deck.name}, a curated collection of links by @${deck.owner.username}.`,
    openGraph: {
      title: deck.name,
      description: deck.metadata.description || `A deck by @${deck.owner.username}`,
      images: deck.metadata.imageUrl ? [{ url: deck.metadata.imageUrl }] : undefined,
    },
  };
}

export default async function DeckPage({ params }: PageProps): Promise<ReactNode> {
  const { username, slug } = await params;

  // Validate username
  const usernameResult = usernameSchema.safeParse(username);
  if (!usernameResult.success) {
    notFound();
  }

  // Validate slug
  const slugResult = deckSlugSchema.safeParse(slug);
  if (!slugResult.success) {
    notFound();
  }

  const normalizedUsername = normalizeUsername(username);
  const deck = await api.decks.getDeckBySlug({ normalizedUsername, slug });

  if (!deck) {
    notFound();
  }

  // User can follow if they're not the owner (auth check happens in the button)
  const canFollow = true; // Client-side component will handle auth state

  return (
    <HydrateClient>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-col gap-6">
          <DeckHeader
            deck={{
              id: deck.id,
              name: deck.name,
              slug: deck.slug,
              metadata: deck.metadata,
              urlsCount: deck.urlsCount,
              followersCount: deck.followersCount,
              isFollowing: deck.isFollowing,
            }}
            owner={deck.owner}
            canFollow={canFollow}
          />

          <section>
            <h2 className="sr-only">URLs in this deck</h2>
            <DeckContent deckId={deck.id} />
          </section>
        </div>
      </div>
    </HydrateClient>
  );
}
