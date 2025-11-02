import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Checkbox } from "@repo/ui/components/checkbox";
import { cn } from "@repo/ui/lib/utils";
import type { FC } from "react";

type TagPickerTag = TagDto & { selected: boolean };

type TagPickerTagsListProps = {
  className?: string;
  tags: ReadonlyArray<TagPickerTag>;
  onTagSelectionChange: (id: TagDto["id"]) => void;
};

export const TagPickerTagsList: FC<TagPickerTagsListProps> = ({
  className,
  tags,
  onTagSelectionChange,
}) => {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {tags.map(({ id, name, urlsCount, selected }) => {
        return (
          <li className="flex items-center space-x-2" key={id}>
            <Checkbox
              id={id}
              className="scale-85 border-slate-800"
              checked={selected}
              onCheckedChange={() => onTagSelectionChange(id)}
            />
            <label
              htmlFor={id}
              className="flex cursor-pointer gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {name}
              {urlsCount > 0 ? (
                <span title="Number of URLs for this tag" className="font-extralight text-slate-600">
                  ({urlsCount})
                </span>
              ) : null}
            </label>
          </li>
        );
      })}
    </ul>
  );
};
