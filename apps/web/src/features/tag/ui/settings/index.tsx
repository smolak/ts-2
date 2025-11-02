"use client";

import { Lightbulb } from "lucide-react";
import type { FC } from "react";
import { api } from "@/trpc/react";
import { AddTag } from "../add-tag";
import { TagList } from "./tag-list";
import { ErrorLoadingTags } from "./error-loading-tags";
import { LoadingTags } from "./loading-tags";

export const TagsSettings: FC = () => {
  const { data, isLoading, isError, refetch } = api.tags.getUserTags.useQuery();

  if (isLoading) {
    return <LoadingTags />;
  }

  if (isError) {
    return <ErrorLoadingTags />;
  }

  return (
    <div className="flex flex-col gap-6 md:max-w-[450px]">
      <AddTag onTagAdd={() => refetch()} />
      <div className="flex flex-col gap-2">
        {data && data.length > 0 ? (
          <p className="flex items-center gap-2 rounded-md border-yellow-500 border-l-4 bg-slate-50 px-2 py-1 text-slate-600 text-sm">
            <Lightbulb size={13} strokeWidth={2.5} className="text-yellow-500" />
            <span className="font-light">Double-click to edit. Escape to cancel.</span>
          </p>
        ) : null}
        {data ? <TagList tags={data} onTagDelete={() => refetch()} /> : null}
      </div>
    </div>
  );
};
