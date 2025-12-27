import type { UserProfile } from "@repo/db/types";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { FC } from "react";
import { DeckSelector } from "@/features/deck/ui/deck-selector";
import { TagsSelector } from "@/features/tag/ui/tags-selector";
import { UserFeedSourceSelector } from "./user-feed-source-selector";

type FeedListFiltersProps = {
  username: UserProfile["username"];
  tags: ReadonlyArray<TagDto>;
  decks?: ReadonlyArray<DeckDto>;
};

export const FeedListFilters: FC<FeedListFiltersProps> = ({ username, tags, decks }) => {
  return (
    <aside className="flex flex-wrap justify-between gap-2">
      <UserFeedSourceSelector author={username} />
      <div className="flex gap-2">
        {decks && decks.length > 0 && <DeckSelector decks={decks} />}
        <TagsSelector author={username} tags={tags} />
      </div>
    </aside>
  );
};
