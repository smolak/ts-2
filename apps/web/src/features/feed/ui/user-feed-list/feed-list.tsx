import type { UserId } from "@repo/db/id/user-id";
import { type FC, useCallback, useEffect, useState } from "react";

import type { FeedDto } from "../../dto/feed.dto";
import { DropdownOptions } from "./dropdown-options";
import { EditFeedItemModal, type OnSuccess } from "./edit-feed-item-modal";
import { FeedListItem } from "./feed-list-item";
import { LikeInteraction } from "./like-interaction";

export interface FeedListProps {
  feed: ReadonlyArray<FeedDto>;
  viewerId?: UserId;
}

export const FeedList: FC<FeedListProps> = ({ feed, viewerId }) => {
  const [editedItem, setEditedItem] = useState<FeedDto | null>(null);
  const [feedItems, setFeedItems] = useState(feed);

  useEffect(() => {
    setFeedItems(feed);
  }, [feed]);

  const onEditSuccess = useCallback<OnSuccess>(
    (tagNames) => {
      const updatedFeedItems = feedItems.map((feedItem) => {
        if (feedItem.id === editedItem?.id) {
          return {
            ...feedItem,
            url: {
              ...feedItem.url,
              tagNames,
            },
          };
        }

        return feedItem;
      });

      setFeedItems(updatedFeedItems);
      setEditedItem(null);
    },
    [editedItem, feedItems],
  );

  return (
    <>
      <section>
        <ol className="flex flex-col gap-4">
          {feedItems.map((feedItem) => (
            <li key={feedItem.id}>
              <FeedListItem
                feedItem={feedItem}
                interactions={<LikeInteraction feedItem={feedItem} viewerId={viewerId} />}
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
