import { User } from "@workspace/db/types";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import Link from "next/link";
import { FC, useCallback, useEffect, useState } from "react";

import { FeedDTO } from "../../dto/feed.dto";
import { DropdownOptions } from "./dropdown-options";
import { EditFeedItemModal, OnSuccess } from "./edit-feed-item-modal";
import { FeedListItem } from "./feed-list-item";
import { NotLikedIcon, ToggleLikeUrl } from "./toggle-like-url";

export interface FeedListProps {
  feed: ReadonlyArray<FeedDTO>;
  viewerId?: User["id"];
}

export const FeedList: FC<FeedListProps> = ({ feed, viewerId }) => {
  const [editedItem, setEditedItem] = useState<FeedDTO | null>(null);
  const [feedItems, setFeedItems] = useState(feed);

  useEffect(() => {
    setFeedItems(feed);
  }, [feed]);

  const onEditSuccess = useCallback<OnSuccess>(
    (categoryNames) => {
      const updatedFeedItems = feedItems.map((feedItem) => {
        if (feedItem.id === editedItem?.id) {
          return {
            ...feedItem,
            url: {
              ...feedItem.url,
              categoryNames,
            },
          };
        }

        return feedItem;
      });

      setFeedItems(updatedFeedItems);
      setEditedItem(null);
    },
    [editedItem, setEditedItem, feedItems, setFeedItems],
  );

  const canLikeUrl = Boolean(viewerId);
  const showCantLikeWithoutLoginMessage = () => {
    toast("Want to like this URL?", {
      description: "💡 You need to be logged in first.",
      action: (
        <Link href="/auth/login">
          <Button>Login</Button>
        </Link>
      ),
    });
  };

  return (
    <>
      <section>
        <ol className="flex flex-col gap-4">
          {feedItems.map((feedItem) => (
            <li key={feedItem.id}>
              <FeedListItem
                feedItem={feedItem}
                interactions={
                  <>
                    {canLikeUrl ? (
                      <ToggleLikeUrl
                        userUrlId={feedItem.userUrlId}
                        liked={feedItem.url.liked}
                        likes={feedItem.url.likesCount}
                      />
                    ) : (
                      <button
                        className="flex items-center gap-1.5 rounded-xl p-2 text-sm hover:bg-red-50"
                        onClick={showCantLikeWithoutLoginMessage}
                      >
                        <NotLikedIcon />
                        {feedItem.url.likesCount}
                      </button>
                    )}
                  </>
                }
                optionsDropdown={
                  viewerId === feedItem.user.id ? <DropdownOptions onEditClick={() => setEditedItem(feedItem)} /> : null
                }
              />
            </li>
          ))}
        </ol>
      </section>
      {editedItem && editedItem.user.id === viewerId ? (
        <EditFeedItemModal
          feedItem={editedItem}
          open={Boolean(editedItem)}
          onOpenChange={() => setEditedItem(null)}
          onSuccess={onEditSuccess}
        />
      ) : null}
    </>
  );
};
