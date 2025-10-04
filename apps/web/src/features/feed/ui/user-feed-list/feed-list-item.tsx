import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Calendar, ExternalLink, Globe, Image as ImageIcon, MoreHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { FC, ReactNode } from "react";

import { LogoIcon } from "@/components/logo";

import { UserImage } from "../../../user/ui/user-image";
import { FeedDTO } from "../../dto/feed.dto";

type FeedListItemProps = {
  feedItem: FeedDTO;
  interactions: ReactNode;
  optionsDropdown?: ReactNode;
};

// TODO: move to some shared constants
const WEB_APP_DOMAIN = "urlshare.app";

export const FeedListItem: FC<FeedListItemProps> = ({ feedItem, interactions, optionsDropdown }) => {
  const { url, createdAt, user } = feedItem;

  // TODO: Implement isImage and isWebsite functions
  const isAnImage = false; //isImage(url.metadata);
  const isAWebsite = true; //isWebsite(url.metadata);
  const isSomethingElse = !isAnImage && !isAWebsite;

  const urlWithoutProtocol = url.url.replace(/^https?:\/\//, "");
  const title = url.metadata.title || urlWithoutProtocol;

  return (
    <div>
      <Card className="w-full overflow-hidden border shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={url.metadata.faviconUrl} alt={`${url.metadata.publisher} favicon`} />
              <AvatarFallback>
                <Globe className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="line-clamp-1 text-xl font-bold">{title}</CardTitle>
              <div className="text-muted-foreground flex items-center text-sm">
                <Globe className="mr-1 h-3 w-3" />
                <span className="max-w-md truncate" title={urlWithoutProtocol}>
                  {urlWithoutProtocol}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        {url.metadata.imageUrl && (
          <figure>
            <a
              href={url.url}
              title={url.metadata.title}
              target="_blank"
              className="max-h-100 flex place-content-center overflow-hidden"
              rel="noreferrer"
            >
              <img
                src={url.metadata.imageUrl}
                alt={`${url.metadata.title} preview`}
                className="object-cover"
              />
            </a>
          </figure>
        )}
        <CardContent className="pb-2">
          <CardDescription className="text-muted-foreground mb-3 line-clamp-3 text-sm">
            {url.metadata.description}
          </CardDescription>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Updated: {createdAt}</span>
            </div>
            {url.metadata.author && (
              <div className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>By: {url.metadata.author}</span>
              </div>
            )}
          </div>

          {url.categoryNames && url.categoryNames.length > 0 && (
            <div className="mt-3">
              {url.categoryNames.map((categoryName) => (
                <Badge key={categoryName} variant="outline" className="mb-1 mr-1">
                  {categoryName}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          <a
            href={url.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center text-xs transition-colors"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Visit Website
          </a>
        </CardFooter>
      </Card>
      <br />
      <Card className="overflow-hidden rounded-sm shadow hover:shadow-lg">
        <CardHeader className="relative cursor-pointer">
          <CardTitle className="flex items-center gap-3">
            {isAnImage && <ImageIcon strokeWidth={1} size={40} className="text-slate-400" aria-label="Image icon" />}
            {isAWebsite && (
              <Avatar className="h-9 w-9">
                <AvatarImage src={url.metadata.faviconUrl} alt={url.metadata.publisher} />
                <AvatarFallback />
              </Avatar>
            )}
            {isSomethingElse && (
              <LogoIcon
                strokeWidth={1}
                size={40}
                className="text-slate-400"
                aria-label={`${WEB_APP_DOMAIN} logo icon`}
              />
            )}
            <a
              href={url.url}
              title={url.metadata.title}
              target="_blank"
              className="overflow-hidden text-ellipsis leading-7 decoration-slate-200 group-hover:underline"
              rel="noreferrer"
            >
              {url.metadata.title || url.url}
            </a>
          </CardTitle>
          <span className="flex flex-row items-center gap-1 pl-12 text-xs text-slate-400">
            <Calendar size={13} />
            <span>{createdAt.toLocaleString()}</span>
          </span>
          {optionsDropdown ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1 h-7 w-7 rounded text-slate-400 hover:text-slate-600"
              >
                <MoreHorizontal size={16} />
              </Button>
              {optionsDropdown}
            </>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {url.metadata.imageUrl && (
            <figure>
              <a
                href={url.url}
                title={url.metadata.title}
                target="_blank"
                className="flex max-h-80 place-content-center overflow-hidden"
                rel="noreferrer"
              >
                <img src={url.metadata.imageUrl} alt={url.metadata.title} className="object-cover" />
              </a>
            </figure>
          )}
          <CardDescription>{url.metadata.description}</CardDescription>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4">
          <div className="flex grow items-center gap-2">
            <div>{interactions}</div>
            <span className="text-xs font-light text-slate-400">{url.categoryNames.join(", ")}</span>
          </div>
          <Link href={`/${user.username}`} className="flex-none">
            <UserImage username={user.username} imageUrl={user.imageUrl} size="small" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
