"use client";

import type { DeckId } from "@repo/db/id/deck-id";
import type { UserId } from "@repo/db/id/user-id";
import type { Deck, UserProfile } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Eye, Link2, Users } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

import { UserImage } from "@/features/user/ui/user-image";

import { FollowDeckButton } from "./follow-deck-button";

type DeckOwner = {
  userId: UserId;
  username: UserProfile["username"];
  imageUrl: UserProfile["imageUrl"];
};

type DeckHeaderProps = {
  deck: {
    id: DeckId;
    name: Deck["name"];
    slug: Deck["slug"];
    metadata: DeckMetadata;
    urlsCount: Deck["urlsCount"];
    followersCount: Deck["followersCount"];
    isFollowing: boolean;
  };
  owner: DeckOwner;
  canFollow: boolean;
};

export const DeckHeader: FC<DeckHeaderProps> = ({ deck, owner, canFollow }) => {
  return (
    <Card className="overflow-hidden">
      {deck.metadata.imageUrl && (
        <div className="h-32 w-full overflow-hidden bg-slate-100">
          <img src={deck.metadata.imageUrl} alt={deck.name} className="h-full w-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              {deck.metadata.color && (
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: deck.metadata.color }}
                  aria-hidden="true"
                />
              )}
              {deck.name}
            </CardTitle>
            {deck.metadata.description && (
              <CardDescription className="text-base">{deck.metadata.description}</CardDescription>
            )}
          </div>
          {canFollow && (
            <FollowDeckButton
              deckId={deck.id}
              initialIsFollowing={deck.isFollowing}
              initialFollowersCount={deck.followersCount}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4 border-t pt-4">
        <Link href={`/${owner.username}`} className="flex items-center gap-2 hover:underline">
          <UserImage username={owner.username} imageUrl={owner.imageUrl} size="small" />
          <span className="font-medium text-sm">@{owner.username}</span>
        </Link>

        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Link2 size={14} />
            <span>{deck.urlsCount} URLs</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users size={14} />
            <span>{deck.followersCount} followers</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye size={14} />
            <span>Public</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
