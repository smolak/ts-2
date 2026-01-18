import type { UserProfile } from "@repo/db/types";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { useSearchParams } from "next/navigation";
import type { FC } from "react";
import { DeckSelector } from "@/features/deck/ui/deck-selector";
import { UserFeedSourceSelector } from "./user-feed-source-selector";

type FeedListFiltersProps = {
  username: UserProfile["username"];
  decks?: ReadonlyArray<DeckDto>;
};

export const FeedListFilters: FC<FeedListFiltersProps> = ({ username, decks }) => {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");

  return (
    <aside className="flex flex-wrap justify-between gap-2">
      <UserFeedSourceSelector author={username} />
      {source === "author" && decks && decks.length > 0 && <DeckSelector decks={decks} />}
    </aside>
  );
};
