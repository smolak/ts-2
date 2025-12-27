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
import { useTagsStore } from "@/features/tag/stores/use-tags-store";
import { TagPickerTagsList } from "@/features/tag/ui/tag-picker/tag-picker-tags-list";
import { api } from "@/trpc/react";
import type { FeedDTO } from "../../dto/feed.dto";

export type OnSuccess = (tagNames: Tag["name"][]) => void;

type EditFeedItemProps = {
  open: boolean;
  onOpenChange: (newOpenValue: boolean) => void;
  onSuccess: OnSuccess;
  feedItem: FeedDTO;
};

const prepareTags = ({ userTags, selectedTagIds }: { userTags: TagDto[]; selectedTagIds: TagDto["id"][] }) =>
  userTags.map((tag) => ({
    ...tag,
    selected: selectedTagIds.indexOf(tag.id) >= 0,
  }));

const prepareDecks = ({ userDecks, selectedDeckIds }: { userDecks: DeckDto[]; selectedDeckIds: Deck["id"][] }) =>
  userDecks.map((deck) => ({
    ...deck,
    selected: selectedDeckIds.indexOf(deck.id) >= 0,
  }));

const getTagIds = (userUrlTags: { tagId: Tag["id"] }[]) => userUrlTags.map(({ tagId }) => tagId);

export const EditFeedItemModal: FC<EditFeedItemProps> = ({ open, onOpenChange, feedItem, onSuccess }) => {
  const userTags = useTagsStore(({ tags }) => tags);
  const setShouldRefetchTags = useTagsStore(({ setShouldRefetchTags }) => setShouldRefetchTags);
  const userDecks = useDecksStore(({ decks }) => decks);
  const setShouldRefetchDecks = useDecksStore(({ setShouldRefetchDecks }) => setShouldRefetchDecks);

  // Query for URL's current tags
  const {
    data: urlTags,
    isLoading: loadingTags,
    isSuccess: tagsLoaded,
    isError: errorLoadingTags,
  } = api.tags.getUserUrlTags.useQuery({
    userUrlId: feedItem.userUrlId,
  });

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
    mutate: updateUserUrl,
    isPending: updatingUserUrl,
    isError: errorUpdatingUserUrl,
  } = api.userUrls.updateUserUrl.useMutation();
  const { mutateAsync: addUrlToDeck, isPending: addingToDeck } = api.decks.addUrlToDeck.useMutation();
  const { mutateAsync: removeUrlFromDeck, isPending: removingFromDeck } = api.decks.removeUrlFromDeck.useMutation();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [initialDeckIds, setInitialDeckIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isLoading = loadingTags || loadingDecks;
  const isDataLoaded = tagsLoaded && decksLoaded;
  const isUpdating = updatingUserUrl || addingToDeck || removingFromDeck || isSaving;

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
      // Update tags
      updateUserUrl({
        userUrlId: feedItem.userUrlId,
        tagIds: selectedTagIds,
      });

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
      const newUserUrlTags = userTags.filter((tag) => selectedTagIds.indexOf(tag.id) !== -1).map(({ name }) => name);
      onSuccess(newUserUrlTags);
      setShouldRefetchTags(true);
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
            <section>
              <h3 className="mb-3 font-medium text-sm">Tags</h3>
              {userTags.length === 0 ? (
                <p className="text-slate-500 text-sm">No tags available.</p>
              ) : (
                <TagPickerTagsList
                  tags={prepareTags({ userTags, selectedTagIds })}
                  onTagSelectionChange={onTagSelectionChange}
                />
              )}
            </section>

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

        {errorUpdatingUserUrl || saveError ? (
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
