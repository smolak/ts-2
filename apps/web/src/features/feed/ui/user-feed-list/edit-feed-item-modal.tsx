import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { Tag } from "@repo/db/types";
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
import { cn } from "@repo/ui/lib/utils";
import { type FC, useCallback, useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useTagsStore } from "../../../tag/stores/use-tags-store";
import { TagPickerTagsList } from "../../../tag/ui/tag-picker/tag-picker-tags-list";
import type { FeedDTO } from "../../dto/feed.dto";

export type OnSuccess = (tagNames: Tag["name"][]) => void;

type EditFeedItemProps = {
  open: boolean;
  onOpenChange: (newOpenValue: boolean) => void;
  onSuccess: OnSuccess;
  feedItem: FeedDTO;
};

const prepareTags = ({
  userTags,
  selectedTagIds,
}: {
  userTags: TagDto[];
  selectedTagIds: TagDto["id"][];
}) =>
  userTags.map((tag) => ({
    ...tag,
    selected: selectedTagIds.indexOf(tag.id) >= 0,
  }));

const getTagIds = (userUrlTags: { tagId: Tag["id"] }[]) =>
  userUrlTags.map(({ tagId }) => tagId);

export const EditFeedItemModal: FC<EditFeedItemProps> = ({ open, onOpenChange, feedItem, onSuccess }) => {
  const userTags = useTagsStore(({ tags }) => tags);
  const setShouldRefetchTags = useTagsStore(({ setShouldRefetchTags }) => setShouldRefetchTags);
  const {
    data,
    isLoading: loadingTags,
    isSuccess: tagsLoaded,
    isError: errorLoadingTags,
  } = api.tags.getUserUrlTags.useQuery({
    userUrlId: feedItem.userUrlId,
  });
  const {
    mutate: updateUserUrl,
    isPending: updatingUserUrl,
    isSuccess: updatedUserUrl,
    isError: errorUpdatingUserUrl,
  } = api.userUrls.updateUserUrl.useMutation();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const onTagSelectionChange = useCallback(
    (tagId: Tag["id"]) => {
      const tagListed = selectedTagIds.indexOf(tagId) !== -1;
      const newSelection = tagListed
        ? selectedTagIds.filter((id) => tagId !== id)
        : [...selectedTagIds, tagId];

      setSelectedTagIds(newSelection);
    },
    [selectedTagIds],
  );

  useEffect(() => {
    if (tagsLoaded) {
      setSelectedTagIds(getTagIds(data));
    }
  }, [tagsLoaded, data]);

  useEffect(() => {
    if (updatedUserUrl) {
      const newUserUrlTags = userTags
        .filter((tag) => selectedTagIds.indexOf(tag.id) !== -1)
        .map(({ name }) => name);

      onSuccess(newUserUrlTags);
      setShouldRefetchTags(true);
    }
  }, [updatedUserUrl, onSuccess, selectedTagIds, userTags, setShouldRefetchTags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Url</DialogTitle>
          <DialogDescription>Right now only tags are editable.</DialogDescription>
        </DialogHeader>
        {loadingTags ? <LoadingIndicator label="Loading tags..." /> : null}
        {errorLoadingTags ? <div>Could not load the tags, try again.</div> : null}
        {tagsLoaded ? (
          <TagPickerTagsList
            tags={prepareTags({ userTags, selectedTagIds })}
            onTagSelectionChange={onTagSelectionChange}
          />
        ) : null}
        {errorUpdatingUserUrl ? (
          <p className="rounded bg-red-50 px-2 py-1 text-sm text-red-600">Could not update Url, try again.</p>
        ) : null}
        <DialogFooter>
          <Button
            type="submit"
            onClick={() =>
              updateUserUrl({
                userUrlId: feedItem.userUrlId,
                tagIds: selectedTagIds,
              })
            }
            disabled={updatedUserUrl}
            className={cn({ loading: updatingUserUrl })}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
