import type { User } from "@repo/db/types";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import Link from "next/link";
import type { FC } from "react";

import type { FeedDto } from "../../dto/feed.dto";
import { NotLikedIcon, ToggleLikeUrl } from "./toggle-like-url";

interface LikeInteractionProps {
  feedItem: FeedDto;
  viewerId?: User["id"];
}

const showCantLikeWithoutLoginMessage = () => {
  toast("Want to like this URL?", {
    description: "💡 You need to be logged in first.",
    action: (
      <Link href="/auth/login">
        <Button>Login</Button>
      </Link>
    ),
  });
};

export const LikeInteraction: FC<LikeInteractionProps> = ({ feedItem, viewerId }) => {
  const isOwner = viewerId === feedItem.user.id;
  const canLike = viewerId && !isOwner;

  if (canLike) {
    return <ToggleLikeUrl userUrlId={feedItem.userUrlId} liked={feedItem.url.liked} likes={feedItem.url.likesCount} />;
  }

  if (isOwner) {
    return (
      <span className="flex items-center gap-1.5 rounded-xl p-2 text-muted-foreground text-sm">
        <NotLikedIcon />
        {feedItem.url.likesCount}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-xl p-2 text-sm hover:bg-red-50"
      onClick={showCantLikeWithoutLoginMessage}
    >
      <NotLikedIcon />
      {feedItem.url.likesCount}
    </button>
  );
};
