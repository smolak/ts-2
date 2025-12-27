import type { DeckDto } from "@repo/deck/dto/deck.dto";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Button } from "@repo/ui/components/button";
import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { Separator } from "@repo/ui/components/separator";
import { Check } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";

import { AddTag } from "../add-tag";
import { DECKS_STORAGE_KEY, DEFAULT_DECK_ID_STORAGE_KEY, TAGS_STORAGE_KEY } from "../constants/storage";
import { DeckPicker } from "../deck-picker";
import { useAddUrl } from "../hooks/use-add-url";
import { useDecks } from "../hooks/use-decks";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useTags } from "../hooks/use-tags";
import { TagPicker } from "../tag-picker";

type AddUrlProps = {
  apiKey: string;
  url: string;
  metadata: ScrappedMetadata | null;
};

export const AddUrl: FC<AddUrlProps> = ({ apiKey, url, metadata }) => {
  const [cachedTags, setCachedTags] = useLocalStorage<TagDto[]>(TAGS_STORAGE_KEY, []);
  const [decks, setDecks] = useLocalStorage<DeckDto[]>(DECKS_STORAGE_KEY, []);
  const [defaultDeckId, setDefaultDeckId] = useLocalStorage<DeckDto["id"] | null>(DEFAULT_DECK_ID_STORAGE_KEY, null);
  const { mutate, isPending, isSuccess, isError } = useAddUrl(apiKey);
  const { data: decksData, isSuccess: decksFetched } = useDecks(apiKey);

  // Single deck selection (required)
  const [selectedDeckId, setSelectedDeckId] = useState<DeckDto["id"] | null>(null);

  // Tags for the selected deck
  const { data: tagsData, isSuccess: tagsFetched, refetch: refetchTags } = useTags(apiKey, selectedDeckId);
  const tags = tagsFetched && tagsData ? tagsData : cachedTags;

  // Update cached tags when fetched
  useEffect(() => {
    if (tagsFetched && tagsData) {
      setCachedTags(tagsData);
    }
  }, [tagsFetched, tagsData, setCachedTags]);

  useEffect(() => {
    if (decksFetched && decksData) {
      setDecks(decksData);
    }
  }, [decksFetched, decksData, setDecks]);

  const [selectedTags, setSelectedTags] = useState<TagDto["id"][]>([]);

  // Initialize selected deck with default preference
  useEffect(() => {
    if (defaultDeckId && selectedDeckId === null && decks.length > 0) {
      const validDefault = decks.some((d) => d.id === defaultDeckId);
      if (validDefault) {
        setSelectedDeckId(defaultDeckId);
      }
    }
  }, [defaultDeckId, decks, selectedDeckId]);

  // Clear selected tags when deck changes
  useEffect(() => {
    setSelectedTags([]);
  }, [selectedDeckId]);

  const onTagSelectionChange = useCallback(
    (tagId: TagDto["id"]) => {
      const tagListed = selectedTags.indexOf(tagId) !== -1;
      const newSelection = tagListed ? selectedTags.filter((id) => tagId !== id) : [...selectedTags, tagId];

      setSelectedTags(newSelection);
    },
    [selectedTags, setSelectedTags],
  );

  const onDeckSelectionChange = useCallback(
    (deckId: DeckDto["id"]) => {
      // Single selection - toggle or select new deck
      const newDeckId = selectedDeckId === deckId ? null : deckId;
      setSelectedDeckId(newDeckId);
      // Update default deck preference
      setDefaultDeckId(newDeckId);
    },
    [selectedDeckId, setDefaultDeckId],
  );

  const addUrl = useCallback(() => {
    if (!metadata || !selectedDeckId) return;

    console.log("Adding URL", { metadata, selectedTags, selectedDeckId });
    mutate({ metadata, tagIds: selectedTags, deckId: selectedDeckId });
  }, [mutate, metadata, selectedTags, selectedDeckId]);

  const isDeckSelected = selectedDeckId !== null;

  return (
    <div className="flex flex-col gap-4 p-2">
      {decks.length > 0 ? (
        <div>
          <h2 className="font-medium text-lg">Deck</h2>
          <DeckPicker
            description="required — select a deck"
            decks={decks}
            selectedDeckIds={selectedDeckId ? [selectedDeckId] : []}
            onDeckSelectionChange={onDeckSelectionChange}
          />
        </div>
      ) : (
        <div className="text-slate-500 text-sm">No decks yet. Create a deck first to add URLs.</div>
      )}

      <Separator />

      {isDeckSelected ? (
        <>
          {tags.length > 0 ? (
            <div>
              <h2 className="font-medium text-lg">Tags</h2>
              <TagPicker
                description="optional"
                tags={tags}
                selectedTags={selectedTags}
                onTagSelectionChange={onTagSelectionChange}
              />
            </div>
          ) : (
            <div className="text-sm">No tags in this deck. Add some.</div>
          )}

          <AddTag apiKey={apiKey} deckId={selectedDeckId} onSuccess={() => refetchTags()} />
        </>
      ) : (
        <div className="text-slate-400 text-sm">Select a deck to manage tags.</div>
      )}

      <Separator />

      {isError && <div className="text-red-500 text-sm">Could not add, try again.</div>}

      <div className="flex items-center gap-2">
        <Button onClick={addUrl} disabled={isPending || metadata === null || !isDeckSelected}>
          Add URL
        </Button>
        {isPending ? <LoadingIndicator label="Adding the URL" className="text-gray-500" size={18} /> : null}
        {isSuccess ? <Check className="text-green-700" /> : null}
      </div>

      <p className="overflow-hidden text-ellipsis font-extralight text-xs">{url}</p>
    </div>
  );
};
