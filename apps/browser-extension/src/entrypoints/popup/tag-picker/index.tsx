import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { FC } from "react";

import { TagPickerTagsList } from "./tag-picker-tags-list";

type TagPickerProps = {
  tags: ReadonlyArray<TagDto>;
  selectedTags: TagDto["id"][];
  onTagSelectionChange: (id: TagDto["id"]) => void;
  description: string;
};

export const TagPicker: FC<TagPickerProps> = ({
  tags,
  selectedTags,
  onTagSelectionChange,
  description,
}) => {
  const tagPickerTags = tags.map((tag) => {
    return {
      ...tag,
      selected: selectedTags.indexOf(tag.id) >= 0,
    };
  });

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h3 className="text-xs font-light text-slate-400">{description}</h3>
      </header>
      <TagPickerTagsList
        tags={tagPickerTags}
        onTagSelectionChange={onTagSelectionChange}
      />
    </section>
  );
};
