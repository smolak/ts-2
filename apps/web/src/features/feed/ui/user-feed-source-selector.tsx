"use client";

import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FC, useCallback } from "react";

import { type FeedSourceValue, feedSourceSchema, feedSources } from "../shared/feed-source";

type UserFeedSourceSelectorProps = {
  className?: string;
  author: string;
};

export const UserFeedSourceSelector: FC<UserFeedSourceSelectorProps> = ({ author, className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const source: FeedSourceValue = feedSourceSchema.parse(searchParams.get("source"));

  const createSearchParamsString = useCallback(
    (source: FeedSourceValue) => {
      const params = new URLSearchParams(searchParams);

      if (source === "default") {
        params.delete("source");
      } else {
        params.set("source", source);
      }

      return params.toString();
    },
    [searchParams],
  );

  const changeSource = async (source: FeedSourceValue) => {
    const searchParamsString = decodeURIComponent(createSearchParamsString(source));
    let path = pathname;

    if (searchParamsString !== "") {
      path += `?${searchParamsString}`;
    }

    router.push(path);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-gray-500 text-sm">Added by:</span>
      <Tabs
        defaultValue={source}
        onValueChange={(source) => {
          changeSource(source as FeedSourceValue);
        }}
      >
        <TabsList>
          {feedSources.map(({ label, value }) => {
            let displayLabel: string = label;

            if (value === "author") {
              displayLabel = author;
            }

            return (
              <TabsTrigger className="px-4" value={value} key={value}>
                {displayLabel}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};
