"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/utils";
import { Calendar, ExternalLink, Globe, Heart, Link2Off } from "lucide-react";
import { useState } from "react";

export interface LinkCardData {
  // URL Metadata
  title?: string;
  description?: string;
  url: string;
  imageUrl?: string;
  faviconUrl?: string;
  logoUrl?: string;
  author?: string;
  publisher?: string;
  date?: string;
  lang?: string;

  // Social/Engagement
  likesCount: number;
  liked?: boolean;
  tagNames: string[];

  // Context
  addedAt: string;
  deckName?: string;
  deckSlug?: string;
  user?: {
    username: string;
    avatarUrl?: string;
  };
}

interface LinkCardProps {
  data: LinkCardData;
  variant?: "full" | "compact";
  onLike?: () => void;
  /** Custom interactions slot - replaces built-in like button when provided */
  interactions?: React.ReactNode;
  /** Options dropdown slot - appears in top-right of card */
  optionsDropdown?: React.ReactNode;
  className?: string;
}

export function LinkCard({ data, variant = "full", onLike, interactions, optionsDropdown, className }: LinkCardProps) {
  const [isLiked, setIsLiked] = useState(data.liked ?? false);
  const [likesCount, setLikesCount] = useState(data.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
  };

  const domain = new URL(data.url).hostname.replace("www.", "");
  const displayPublisher = data.publisher || domain;
  const formattedDate = new Date(data.addedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/50 bg-card/50 py-0 backdrop-blur-sm hover:border-border hover:shadow-sm",
        className,
      )}
    >
      <div className="relative">
        {/* Header Section */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Favicon/Logo */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-secondary/50">
              {data.faviconUrl || data.logoUrl ? (
                <img src={data.faviconUrl || data.logoUrl} alt={displayPublisher} className="h-6 w-6 object-contain" />
              ) : (
                <Globe className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Title & Publisher */}
            <div className="min-w-0 flex-1">
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="group/link">
                <h3 className="mb-1 line-clamp-2 font-semibold text-foreground text-lg leading-snug group-hover/link:text-primary group-hover/link:underline">
                  {data.title || data.url}
                </h3>
              </a>
              <div className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
                <span>{displayPublisher}</span>
                {data.author && (
                  <>
                    <span>•</span>
                    <span className="truncate">{data.author}</span>
                  </>
                )}
              </div>
            </div>

            {/* Options Dropdown */}
            {optionsDropdown && <div className="flex-shrink-0">{optionsDropdown}</div>}
          </div>
        </div>

        {/* Preview Image */}
        {variant === "full" && data.imageUrl && (
          <div className="relative mx-4 h-72 overflow-hidden rounded-lg border border-border/50">
            <img src={data.imageUrl} alt={data.title || "Link preview"} className="h-full w-full object-cover" />
          </div>
        )}

        {/* No Image State */}
        {variant === "full" && !data.imageUrl && (
          <div className="relative mx-4 flex h-32 items-center justify-center rounded-lg border border-border/50 border-dashed bg-secondary/20">
            <Link2Off className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="px-4 pt-3">
            <p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">{data.description}</p>
          </div>
        )}

        {/* Tags */}
        {data.tagNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3">
            {data.tagNames.slice(0, 6).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="border border-border/30 bg-secondary/50 px-2 py-0.5 font-mono text-xs hover:bg-secondary"
              >
                {tag}
              </Badge>
            ))}
            {data.tagNames.length > 6 && (
              <Badge variant="outline" className="px-2 py-0.5 font-mono text-xs">
                +{data.tagNames.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between gap-4 border-border/30 border-t px-4 py-3">
          {/* User Info & Date */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {data.user && (
              <Avatar className="h-6 w-6 border border-border/50">
                <AvatarImage src={data.user.avatarUrl} alt={data.user.username} />
                <AvatarFallback className="font-mono text-[10px]">
                  {data.user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex min-w-0 items-center gap-2 font-mono text-muted-foreground text-xs">
              {data.user && (
                <>
                  <span className="truncate">{data.user.username}</span>
                  <span className="text-muted-foreground/50">•</span>
                </>
              )}
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1">
            {/* Custom interactions or built-in like button */}
            {interactions ?? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(
                  "h-8 gap-1.5 px-2.5",
                  isLiked ? "text-primary hover:text-primary" : "text-muted-foreground",
                )}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-primary")} />
                <span className="font-mono text-xs">{likesCount}</span>
              </Button>
            )}

            {/* External Link */}
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
              <a href={data.url} target="_blank" rel="noopener noreferrer" aria-label="Visit link">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LinkCardSkeleton({ variant = "full" }: { variant?: "full" | "compact" }) {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-lg bg-secondary/50" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-secondary/50" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary/50" />
          </div>
        </div>
      </div>

      {variant === "full" && <div className="mx-4 h-64 animate-pulse rounded-lg bg-secondary/50" />}

      <div className="space-y-2 px-4 pt-3">
        <div className="h-3 animate-pulse rounded bg-secondary/50" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-secondary/50" />
      </div>

      <div className="flex gap-2 px-4 pt-3">
        <div className="h-5 w-16 animate-pulse rounded bg-secondary/50" />
        <div className="h-5 w-20 animate-pulse rounded bg-secondary/50" />
        <div className="h-5 w-14 animate-pulse rounded bg-secondary/50" />
      </div>

      <div className="mt-2 flex items-center justify-between border-border/30 border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-pulse rounded-full bg-secondary/50" />
          <div className="h-3 w-24 animate-pulse rounded bg-secondary/50" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-12 animate-pulse rounded bg-secondary/50" />
          <div className="h-8 w-8 animate-pulse rounded bg-secondary/50" />
        </div>
      </div>
    </Card>
  );
}
