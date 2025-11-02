"use client";

import type { TagDto } from "@repo/tag/dto/tag.dto";
import type { Tag } from "@repo/db/types";
import { createPossessiveForm } from "@repo/shared/utils/create-possessive-form";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Info } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import qs from "qs";
import { type FC, useCallback } from "react";
import { TagPickerTagsList } from "../tag-picker/tag-picker-tags-list";

type TagsSelectorProps = {
  tags: ReadonlyArray<TagDto>;
  author: string;
};

const createExplanation = (username: string) => {
  if (username === "Me") {
    return "Filtering by tag will narrow down your URLs only, as tags are not shared, they are yours.";
  }

  return `Filtering by tags will narrow down ${createPossessiveForm(
    username,
  )} URLs only, as tags are not shared.`;
};

const getSelectedTags = (tags: ReadonlyArray<TagDto>, searchParams: string): TagDto["id"][] => {
  const tagsString = qs.parse(searchParams).tags;

  // Only one way of passing tag IDs is accepted.
  const tagsInSearchParams = typeof tagsString === "string" ? tagsString.split(",") : [];

  return tags.filter(({ id }) => tagsInSearchParams.indexOf(id) >= 0).map(({ id }) => id);
};

export const TagsSelector: FC<TagsSelectorProps> = ({ author, tags }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTags = getSelectedTags(tags, searchParams.toString());
  const allTagsChecked = selectedTags.length === 0;

  const onAllTagsClick = useCallback(async () => {
    if (allTagsChecked) {
      return;
    }

    const params = new URLSearchParams(searchParams);

    params.delete("tags");

    if (params.toString() === "") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?${decodeURIComponent(params.toString())}`);
    }
  }, [allTagsChecked, pathname, router, searchParams]);

  const onTagSelectionChange = useCallback(
    async (tagId: Tag["id"]) => {
      const params = new URLSearchParams(searchParams);
      let newSelectedTags = selectedTags;

      if (selectedTags.indexOf(tagId) >= 0) {
        newSelectedTags = selectedTags.filter((id) => id !== tagId);
      } else {
        newSelectedTags.push(tagId);
      }

      if (newSelectedTags.length === 0) {
        params.delete("tags");
      } else {
        // Sorting makes sure that same tags construct same query params order.
        // Good for browser caching.
        params.set("tags", newSelectedTags.sort().join(","));
      }

      if (params.toString() === "") {
        router.push(pathname);
      } else {
        router.push(`${pathname}?${decodeURIComponent(params.toString())}`);
      }
    },
    [searchParams, selectedTags, pathname, router],
  );

  const tagPickerTags = tags.map((tag) => {
    return {
      ...tag,
      selected: selectedTags.indexOf(tag.id) >= 0,
    };
  });

  const buttonLabel = selectedTags.length === 0 ? "Tags" : `Tags (${selectedTags.length})`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px]">
          {buttonLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {tags.length > 0 ? (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Info size={14} strokeWidth={2.5} className="absolute right-3.5 top-3.5 z-50 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent className="bg-slate-100 text-sm">{createExplanation(author)}</PopoverContent>
            </Popover>
            <DropdownMenuCheckboxItem
              checked={allTagsChecked}
              onClick={onAllTagsClick}
              className="cursor-pointer"
            >
              Any tag
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <TagPickerTagsList
              className="p-2"
              tags={tagPickerTags}
              onTagSelectionChange={onTagSelectionChange}
            />
          </>
        ) : (
          <p className="p-2 text-sm">No tags here, yet</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
