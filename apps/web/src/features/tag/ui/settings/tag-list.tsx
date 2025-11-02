import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { FC } from "react";
import { TagListItem } from "./tag-list-item";

type TagsListProps = {
  tags: ReadonlyArray<TagDto>;
  onTagDelete: () => void;
};

export const TagList: FC<TagsListProps> = ({ tags, onTagDelete }) => {
  return (
    <ol className="flex flex-col gap-2">
      {tags.map((tag) => {
        return (
          <li key={tag.id}>
            <TagListItem tag={tag} onTagDelete={() => onTagDelete()} />
          </li>
        );
      })}
    </ol>
  );
};
