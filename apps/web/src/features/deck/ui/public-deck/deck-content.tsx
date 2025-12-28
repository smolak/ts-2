"use client";

import type { Deck, Tag } from "@repo/db/types";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Tag as TagIcon, X } from "lucide-react";
import { type FC, useCallback, useState } from "react";

import { api } from "@/trpc/react";

import { DeckUrlList } from "./deck-url-list";

type DeckTagFilterProps = {
  tags: TagDto[];
  selectedTagIds: Tag["id"][];
  onTagToggle: (tagId: Tag["id"]) => void;
  onClearAll: () => void;
};

const DeckTagFilter: FC<DeckTagFilterProps> = ({ tags, selectedTagIds, onTagToggle, onClearAll }) => {
  if (tags.length === 0) {
    return null;
  }

  const hasSelection = selectedTagIds.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <TagIcon className="h-4 w-4" />
          <span>Filter by tags</span>
        </div>
        {hasSelection && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 px-2 text-xs">
            <X className="mr-1 h-3 w-3" />
            Clear filter
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <Badge
              key={tag.id}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/80"
              onClick={() => onTagToggle(tag.id)}
            >
              {tag.displayName}
              {tag.urlsCount > 0 && <span className="ml-1 text-xs opacity-70">({tag.urlsCount})</span>}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

type DeckContentProps = {
  deckId: Deck["id"];
};

export const DeckContent: FC<DeckContentProps> = ({ deckId }) => {
  const [selectedTagIds, setSelectedTagIds] = useState<Tag["id"][]>([]);

  const { data: tags = [], isLoading: loadingTags } = api.tags.getDeckTags.useQuery(
    { deckId },
    { staleTime: 60000 }, // Cache for 1 minute
  );

  const handleTagToggle = useCallback((tagId: Tag["id"]) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedTagIds([]);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {!loadingTags && tags.length > 0 && (
        <DeckTagFilter
          tags={tags}
          selectedTagIds={selectedTagIds}
          onTagToggle={handleTagToggle}
          onClearAll={handleClearAll}
        />
      )}

      <DeckUrlList deckId={deckId} tagIds={selectedTagIds} />
    </div>
  );
};
