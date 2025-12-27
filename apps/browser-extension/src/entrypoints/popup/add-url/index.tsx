import type { DeckDto } from "@repo/deck/dto/deck.dto";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Button } from "@repo/ui/components/button";
import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { Separator } from "@repo/ui/components/separator";
import { Check } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";

import { AddTag } from "../add-tag";
import { DECKS_STORAGE_KEY, DEFAULT_DECK_IDS_STORAGE_KEY, TAGS_STORAGE_KEY } from "../constants/storage";
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
  const [tags, setTags] = useLocalStorage<TagDto[]>(TAGS_STORAGE_KEY, []);
  const [decks, setDecks] = useLocalStorage<DeckDto[]>(DECKS_STORAGE_KEY, []);
  const [defaultDeckIds, setDefaultDeckIds] = useLocalStorage<DeckDto["id"][]>(DEFAULT_DECK_IDS_STORAGE_KEY, []);
  const { mutate, isPending, isSuccess, isError } = useAddUrl(apiKey);
  const { data: tagsData, isSuccess: tagsFetched, refetch: refetchTags } = useTags(apiKey);
  const { data: decksData, isSuccess: decksFetched } = useDecks(apiKey);

  useEffect(() => {
    if (tagsFetched && tagsData) {
      setTags(tagsData);
    }
  }, [tagsFetched, tagsData, setTags]);

  useEffect(() => {
    if (decksFetched && decksData) {
      setDecks(decksData);
    }
  }, [decksFetched, decksData, setDecks]);

  const [selectedTags, setSelectedTags] = useState<TagDto["id"][]>([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState<DeckDto["id"][]>([]);

  // Initialize selected decks with default deck preferences
  useEffect(() => {
    if (defaultDeckIds.length > 0 && selectedDeckIds.length === 0 && decks.length > 0) {
      // Only set defaults if they exist in the current deck list
      const validDefaults = defaultDeckIds.filter((id) => decks.some((d) => d.id === id));
      if (validDefaults.length > 0) {
        setSelectedDeckIds(validDefaults);
      }
    }
  }, [defaultDeckIds, decks, selectedDeckIds.length]);

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
      const deckListed = selectedDeckIds.indexOf(deckId) !== -1;
      const newSelection = deckListed ? selectedDeckIds.filter((id) => deckId !== id) : [...selectedDeckIds, deckId];

      setSelectedDeckIds(newSelection);
      // Update default deck preference when user changes selection
      setDefaultDeckIds(newSelection);
    },
    [selectedDeckIds, setSelectedDeckIds, setDefaultDeckIds],
  );

  const addUrl = useCallback(() => {
    if (!metadata) return;

    console.log("Adding URL", { metadata, selectedTags, selectedDeckIds });
    mutate({ metadata, tagIds: selectedTags, deckIds: selectedDeckIds });
  }, [mutate, metadata, selectedTags, selectedDeckIds]);

  return (
    <div className="flex flex-col gap-4 p-2">
      {decks.length > 0 ? (
        <div>
          <h2 className="font-medium text-lg">Decks</h2>
          <DeckPicker
            description="optional — add to decks"
            decks={decks}
            selectedDeckIds={selectedDeckIds}
            onDeckSelectionChange={onDeckSelectionChange}
          />
        </div>
      ) : (
        <div className="text-slate-500 text-sm">No decks yet.</div>
      )}

      <Separator />

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
        <div className="text-sm">No tags. Add some.</div>
      )}

      <AddTag apiKey={apiKey} onSuccess={() => refetchTags()} />
      <Separator />

      {isError && <div>Could not add, try again.</div>}

      <div className="flex items-center gap-2">
        <Button onClick={addUrl} disabled={isPending || metadata === null}>
          Add URL
        </Button>
        {isPending ? <LoadingIndicator label="Adding the URL" className="text-gray-500" size={18} /> : null}
        {isSuccess ? <Check className="text-green-700" /> : null}
      </div>

      <p className="overflow-hidden text-ellipsis font-extralight text-xs">{url}</p>
    </div>
  );
};
