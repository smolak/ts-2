import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import { Button } from "@repo/ui/components/button";
import { LoadingIndicator } from "@repo/ui/components/loading-indicator";
import { Separator } from "@repo/ui/components/separator";
import { Check } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";

import { AddTag } from "../add-tag";
import { TagPicker } from "../tag-picker";
import { TAGS_STORAGE_KEY } from "../constants/storage";
import { useAddUrl } from "../hooks/use-add-url";
import { useTags } from "../hooks/use-tags";
import { useLocalStorage } from "../hooks/use-local-storage";

type AddUrlProps = {
  apiKey: string;
  url: string;
  metadata: ScrappedMetadata | null;
};

export const AddUrl: FC<AddUrlProps> = ({ apiKey, url, metadata }) => {
  const [tags, setTags] = useLocalStorage<TagDto[]>(TAGS_STORAGE_KEY, []);
  const { mutate, isPending, isSuccess, isError } = useAddUrl(apiKey);
  const { data, isSuccess: tagsFetched, refetch } = useTags(apiKey);

  useEffect(() => {
    if (tagsFetched) {
      setTags(data);
    }
  }, [tagsFetched, data, setTags]);

  const [selectedTags, setSelectedTags] = useState<TagDto["id"][]>([]);

  const onTagSelectionChange = useCallback(
    (tagId: TagDto["id"]) => {
      const tagListed = selectedTags.indexOf(tagId) !== -1;
      const newSelection = tagListed
        ? selectedTags.filter((id) => tagId !== id)
        : [...selectedTags, tagId];

      setSelectedTags(newSelection);
    },
    [selectedTags, setSelectedTags],
  );

  const addUrl = useCallback(() => {
    console.log("Adding URL", { metadata, selectedTags });
    mutate({ metadata, tagIds: selectedTags });
  }, [mutate, metadata, selectedTags]);

  return (
    <div className="flex flex-col gap-4 p-2">
      {tags.length > 0 ? (
        <div>
          <h2 className="text-lg font-medium">Tags</h2>
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

      <AddTag apiKey={apiKey} onSuccess={() => refetch()} />
      <Separator />

      {isError && <div>Could not add, try again.</div>}

      <div className="flex items-center gap-2">
        <Button onClick={addUrl} disabled={isPending || metadata === null}>
          Add URL
        </Button>
        {isPending ? <LoadingIndicator label="Adding the URL" className="text-gray-500" size={18} /> : null}
        {isSuccess ? <Check className="text-green-700" /> : null}
      </div>

      <p className="overflow-hidden text-ellipsis text-xs font-extralight">{url}</p>
    </div>
  );
};
