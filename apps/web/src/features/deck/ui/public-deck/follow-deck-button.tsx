"use client";

import type { DeckId } from "@repo/db/id/deck-id";
import type { Deck } from "@repo/db/types";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { UserMinus, UserPlus } from "lucide-react";
import { type FC, useState } from "react";

import { api } from "@/trpc/react";

type FollowDeckButtonProps = {
  deckId: DeckId;
  initialIsFollowing: boolean;
  initialFollowersCount: Deck["followersCount"];
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void;
};

export const FollowDeckButton: FC<FollowDeckButtonProps> = ({
  deckId,
  initialIsFollowing,
  initialFollowersCount,
  onFollowChange,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);

  const { mutate, isPending } = api.decks.toggleFollowDeck.useMutation({
    onSuccess: (data) => {
      const newIsFollowing = data.status === "following";
      setIsFollowing(newIsFollowing);
      setFollowersCount(data.followersCount);
      onFollowChange?.(newIsFollowing, data.followersCount);
    },
  });

  const handleClick = () => {
    mutate({ deckId });
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn("gap-2", { loading: isPending })}
    >
      {isFollowing ? (
        <>
          <UserMinus size={16} />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus size={16} />
          <span>Follow</span>
        </>
      )}
      <span className="font-normal text-muted-foreground">({followersCount})</span>
    </Button>
  );
};
