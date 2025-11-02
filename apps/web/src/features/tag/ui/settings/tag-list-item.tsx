"use client";

import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { ActionButton } from "./action-button";
import { DeleteTag } from "./delete-tag";
import { EditTag } from "./edit-tag";

type TagListItemProps = {
  tag: TagDto;
  onTagDelete: () => void;
};

type CrudState = "idle" | "edit" | "delete";

export const TagListItem: FC<TagListItemProps> = ({ tag, onTagDelete }) => {
  const [tagName, setTagName] = useState(tag.name);
  const [state, setState] = useState<CrudState>("idle");

  if (state === "edit") {
    return (
      <EditTag
        tag={{ ...tag, name: tagName }}
        onSave={(newName) => {
          setTagName(newName);
          setState("idle");
        }}
        onCancel={() => setState("idle")}
      />
    );
  }

  if (state === "delete") {
    return <DeleteTag tag={tag} onDelete={() => onTagDelete()} onCancel={() => setState("idle")} />;
  }

  return (
    <span className="space-between flex h-[42px] items-center justify-between rounded-md border border-transparent px-1 transition-all hover:bg-slate-50">
      <button type="button" className="flex w-full items-center gap-2" onDoubleClick={() => setState("edit")}>
        <span className="p-2">{tagName}</span>
        {tag.urlsCount > 0 ? (
          <span title="Number of URLs for this tag" className="font-extralight text-slate-600">
            ({tag.urlsCount})
          </span>
        ) : null}
      </button>
      <span className="flex text-gray-600">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ActionButton onClick={() => setState("edit")} className="group hover:bg-sky-100">
                <Pencil size={14} className="group-hover:text-sky-600" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit tag name.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ActionButton onClick={() => setState("delete")} className="group hover:bg-red-100">
                <Trash2 size={14} className="group-hover:text-red-600" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete?</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    </span>
  );
};
