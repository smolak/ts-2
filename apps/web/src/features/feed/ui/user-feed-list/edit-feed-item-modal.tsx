import type { Deck, Tag } from "@repo/db/types";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { Separator } from "@repo/ui/components/separator";
import { cn } from "@repo/ui/lib/utils";
import { type FC, useCallback, useEffect, useState } from "react";
import { useDecksStore } from "@/features/deck/stores/use-decks-store";
import { DeckPickerList } from "@/features/deck/ui/deck-picker/deck-picker-list";
import { TagPickerTagsList } from "@/features/tag/ui/tag-picker/tag-picker-tags-list";
import { api } from "@/trpc/react";
import type { FeedDto } from "../../dto/feed.dto";

export type OnSuccess = (tagNames: Tag["name"][]) => void;

type EditFeedItemProps = {
  open: boolean;
  onOpenChange: (newOpenValue: boolean) => void;
  onSuccess: OnSuccess;
  feedItem: FeedDto;
};

const prepareTags = ({ tags, selectedTagIds }: { tags: TagDto[]; selectedTagIds: TagDto["id"][] }) =>
  tags.map((tag) => ({
    ...tag,
    selected: selectedTagIds.indexOf(tag.id) >= 0,
  }));

const prepareDecks = ({ userDecks, selectedDeckIds }: { userDecks: DeckDto[]; selectedDeckIds: Deck["id"][] }) =>
  userDecks.map((deck) => ({
    ...deck,
    selected: selectedDeckIds.indexOf(deck.id) >= 0,
  }));

const getTagIds = (tags: { id: Tag["id"] }[]) => tags.map(({ id }) => id);

export const EditFeedItemModal: FC<EditFeedItemProps> = ({ open, onOpenChange, feedItem, onSuccess }) => {
  const userDecks = useDecksStore(({ decks }) => decks);
  const setShouldRefetchDecks = useDecksStore(({ setShouldRefetchDecks }) => setShouldRefetchDecks);

  // Get the deck ID from the feed item (required for deck-specific tag operations)
  const deckId = feedItem.deck?.id;

  // Query for deck's available tags
  const {
    data: deckTags,
    isLoading: loadingDeckTags,
    isSuccess: deckTagsLoaded,
    isError: errorLoadingDeckTags,
  } = api.tags.getDeckTags.useQuery({ deckId: deckId! }, { enabled: !!deckId });

  // Query for URL's current tags in this deck
  const {
    data: urlTags,
    isLoading: loadingUrlTags,
    isSuccess: urlTagsLoaded,
    isError: errorLoadingUrlTags,
  } = api.tags.getDeckUrlTags.useQuery({ deckId: deckId!, userUrlId: feedItem.userUrlId }, { enabled: !!deckId });

  const loadingTags = loadingDeckTags || loadingUrlTags;
  const tagsLoaded = deckTagsLoaded && urlTagsLoaded;
  const errorLoadingTags = errorLoadingDeckTags || errorLoadingUrlTags;

  // Query for URL's current decks
  const {
    data: urlDecks,
    isLoading: loadingDecks,
    isSuccess: decksLoaded,
    isError: errorLoadingDecks,
  } = api.decks.getUrlDecks.useQuery({
    userUrlId: feedItem.userUrlId,
  });

  // Mutations
  const {
    mutate: updateDeckUrlTags,
    isPending: updatingDeckUrlTags,
    isError: errorUpdatingDeckUrlTags,
  } = api.userUrls.updateDeckUrlTags.useMutation();
  const { mutateAsync: addUrlToDeck, isPending: addingToDeck } = api.decks.addUrlToDeck.useMutation();
  const { mutateAsync: removeUrlFromDeck, isPending: removingFromDeck } = api.decks.removeUrlFromDeck.useMutation();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [initialDeckIds, setInitialDeckIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isLoading = loadingTags || loadingDecks;
  const isDataLoaded = (deckId ? tagsLoaded : true) && decksLoaded;
  const isUpdating = updatingDeckUrlTags || addingToDeck || removingFromDeck || isSaving;

  const onTagSelectionChange = useCallback(
    (tagId: Tag["id"]) => {
      const tagListed = selectedTagIds.indexOf(tagId) !== -1;
      const newSelection = tagListed ? selectedTagIds.filter((id) => tagId !== id) : [...selectedTagIds, tagId];

      setSelectedTagIds(newSelection);
    },
    [selectedTagIds],
  );

  const onDeckSelectionChange = useCallback(
    (deckId: Deck["id"]) => {
      const deckListed = selectedDeckIds.indexOf(deckId) !== -1;
      const newSelection = deckListed ? selectedDeckIds.filter((id) => deckId !== id) : [...selectedDeckIds, deckId];
      setSelectedDeckIds(newSelection);
    },
    [selectedDeckIds],
  );

  // Initialize selected tags from loaded data
  useEffect(() => {
    if (tagsLoaded && urlTags) {
      setSelectedTagIds(getTagIds(urlTags));
    }
  }, [tagsLoaded, urlTags]);

  // Initialize selected decks from loaded data
  useEffect(() => {
    if (decksLoaded && urlDecks) {
      const deckIds = urlDecks.map((d) => d.id);
      setSelectedDeckIds(deckIds);
      setInitialDeckIds(deckIds);
    }
  }, [decksLoaded, urlDecks]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [open]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Update tags (only if we have a deck context)
      if (deckId) {
        updateDeckUrlTags({
          deckId,
          userUrlId: feedItem.userUrlId,
          tagIds: selectedTagIds,
        });
      }

      // Calculate deck changes
      const decksToAdd = selectedDeckIds.filter((id) => !initialDeckIds.includes(id));
      const decksToRemove = initialDeckIds.filter((id) => !selectedDeckIds.includes(id));

      // Add URL to new decks
      await Promise.all(
        decksToAdd.map((deckId) =>
          addUrlToDeck({
            deckId,
            userUrlId: feedItem.userUrlId,
          }),
        ),
      );

      // Remove URL from unselected decks
      await Promise.all(
        decksToRemove.map((deckId) =>
          removeUrlFromDeck({
            deckId,
            userUrlId: feedItem.userUrlId,
          }),
        ),
      );

      // Update the initial deck IDs to reflect the new state
      setInitialDeckIds(selectedDeckIds);

      // Notify success
      const newTagNames = (deckTags ?? [])
        .filter((tag) => selectedTagIds.indexOf(tag.id) !== -1)
        .map(({ name }) => name);
      onSuccess(newTagNames);
      setShouldRefetchDecks(true);
      setSaveSuccess(true);
    } catch (_error) {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out pending deletion decks
  const availableDecks = userDecks.filter((deck) => deck.scheduledForDeletionAt === null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit URL</DialogTitle>
          <DialogDescription>Manage tags and decks for this URL.</DialogDescription>
        </DialogHeader>

        {isLoading ? <LoadingIndicator label="Loading..." /> : null}

        {errorLoadingTags || errorLoadingDecks ? (
          <div className="text-red-600">Could not load the data, try again.</div>
        ) : null}

        {isDataLoaded ? (
          <div className="flex flex-col gap-6">
            {deckId ? (
              <section>
                <h3 className="mb-3 font-medium text-sm">Tags</h3>
                {(deckTags ?? []).length === 0 ? (
                  <p className="text-slate-500 text-sm">No tags available for this deck.</p>
                ) : (
                  <TagPickerTagsList
                    tags={prepareTags({ tags: deckTags ?? [], selectedTagIds })}
                    onTagSelectionChange={onTagSelectionChange}
                  />
                )}
              </section>
            ) : (
              <section>
                <h3 className="mb-3 font-medium text-sm">Tags</h3>
                <p className="text-slate-500 text-sm">
                  Tags are managed per deck. Add this URL to a deck to manage tags.
                </p>
              </section>
            )}

            <Separator />

            <section>
              <h3 className="mb-3 font-medium text-sm">Decks</h3>
              {availableDecks.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No decks available. Create a deck in settings to organize your links.
                </p>
              ) : (
                <DeckPickerList
                  decks={prepareDecks({ userDecks: availableDecks, selectedDeckIds })}
                  onDeckSelectionChange={onDeckSelectionChange}
                />
              )}
            </section>
          </div>
        ) : null}

        {errorUpdatingDeckUrlTags || saveError ? (
          <p className="rounded bg-red-50 px-2 py-1 text-red-600 text-sm">
            {saveError || "Could not update URL, try again."}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={saveSuccess || isUpdating}
            className={cn({ loading: isUpdating })}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
