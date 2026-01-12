"use client";

import type { DeckId } from "@repo/db/id/deck-id";
import type { Deck, UserProfile } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Layers, Link2, Users } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

type PublicDeck = {
  id: DeckId;
  name: Deck["name"];
  slug: Deck["slug"];
  metadata: DeckMetadata;
  urlsCount: Deck["urlsCount"];
  followersCount: Deck["followersCount"];
};

type PublicDecksGridProps = {
  decks: PublicDeck[];
  username: UserProfile["username"];
};

const DeckCard: FC<{ deck: PublicDeck; username: string }> = ({ deck, username }) => {
  return (
    <Link href={`/${username}/${deck.slug}`} className="block">
      <Card className="h-full transition-all hover:border-primary/20 hover:shadow-md">
        {deck.metadata.imageUrl && (
          <div className="h-24 w-full overflow-hidden bg-slate-100">
            <img src={deck.metadata.imageUrl} alt={deck.name} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {deck.metadata.color ? (
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: deck.metadata.color }}
                aria-hidden="true"
              />
            ) : (
              <Layers size={14} className="shrink-0 text-slate-400" />
            )}
            <span className="truncate">{deck.name}</span>
          </CardTitle>
          {deck.metadata.description && (
            <CardDescription className="line-clamp-2 text-sm">{deck.metadata.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Link2 size={12} />
            {deck.urlsCount}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {deck.followersCount}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};

export const PublicDecksGrid: FC<PublicDecksGridProps> = ({ decks, username }) => {
  if (decks.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium text-slate-600 text-sm">
          <Layers size={16} />
          <span>Decks</span>
          <Badge variant="secondary" className="text-xs">
            {decks.length}
          </Badge>
        </h2>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} username={username} />
        ))}
      </div>
    </section>
  );
};
