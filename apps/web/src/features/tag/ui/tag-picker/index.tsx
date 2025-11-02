import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { Tag } from "@repo/db/types";
import { Settings } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

import { TagPickerTagsList } from "./tag-picker-tags-list";

type TagPickerProps = {
  tags: ReadonlyArray<TagDto>;
  selectedTags: Tag["id"][];
  onTagSelectionChange: (id: Tag["id"]) => void;
  description: string;
  showSettingsLink?: boolean;
};

export const TagPicker: FC<TagPickerProps> = ({
  tags,
  selectedTags,
  onTagSelectionChange,
  description,
  showSettingsLink = true,
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
        {showSettingsLink ? (
          <span className="flex items-center gap-2">
            <Link href="/settings/tags" className="cursor-pointer rounded p-1.5 hover:bg-slate-100">
              <Settings size={14} className="text-slate-400" />
            </Link>
          </span>
        ) : null}
      </header>
      <TagPickerTagsList
        tags={tagPickerTags}
        onTagSelectionChange={onTagSelectionChange}
      />
    </section>
  );
};
