import { db, orm, schema } from "@repo/db/db";
import type { Deck, Feed, Tag, User } from "@repo/db/types";

import type { FeedSourceValue } from "../shared/feed-source";

type GetUserFeedQueryOptions = {
  userId: User["id"];
  viewerId?: User["id"];
  limit: number;
  cursor?: Feed["createdAt"];
  feedSource?: FeedSourceValue;
  tagIds: Tag["id"][];
  deckId?: Deck["id"];
};

/**
 * Creates a subquery to efficiently filter user_urls that have ALL specified tags.
 * This approach filters early (before joins) to reduce intermediate result set size.
 * Also filters out deleted user-URL relationships.
 */
const createTagFilterSubquery = (tagIds: Tag["id"][]) => {
  return db
    .select({ userUrlId: schema.userUrlsTags.userUrlId })
    .from(schema.userUrlsTags)
    .innerJoin(schema.usersUrls, orm.eq(schema.userUrlsTags.userUrlId, schema.usersUrls.id))
    .where(orm.and(orm.inArray(schema.userUrlsTags.tagId, tagIds), orm.eq(schema.usersUrls.isDeleted, false)))
    .groupBy(schema.userUrlsTags.userUrlId)
    .having(orm.sql`COUNT(DISTINCT ${schema.userUrlsTags.tagId}) >= ${tagIds.length}`);
};

export const getUserFeedQuery = ({
  userId,
  viewerId,
  limit,
  cursor,
  feedSource,
  tagIds,
  deckId,
}: GetUserFeedQueryOptions) => {
  const baseGroupBy = [
    schema.feeds.id,
    schema.userProfiles.username,
    schema.userProfiles.imageUrl,
    schema.userProfiles.userId,
    schema.feeds.createdAt,
    schema.urls.url,
    schema.urls.metadata,
    schema.usersUrls.likesCount,
    schema.feeds.userUrlId,
    schema.decks.id,
    schema.decks.name,
    schema.decks.slug,
  ];

  const groupBy = viewerId ? [...baseGroupBy, schema.usersUrlsInteractions.userId] : baseGroupBy;

  const includeTags = tagIds.length > 0;

  const query = db
    .select({
      user_username: schema.userProfiles.username,
      user_imageUrl: schema.userProfiles.imageUrl,
      user_userId: schema.userProfiles.userId,
      feed_id: schema.feeds.id,
      feed_createdAt: schema.feeds.createdAt,
      url_url: schema.urls.url,
      url_metadata: schema.urls.metadata,
      url_likesCount: schema.usersUrls.likesCount,
      userUrl_id: schema.feeds.userUrlId,
      userUrl_liked: orm.sql<boolean>`COALESCE(${schema.usersUrlsInteractions.userId} IS NOT NULL, FALSE)`.as(
        "userUrl_liked",
      ),
      tag_names: orm.sql<string | null>`STRING_AGG(DISTINCT ${schema.tags.name}, ', ' ORDER BY ${schema.tags.name})`,
      deck_id: schema.decks.id,
      deck_name: schema.decks.name,
      deck_slug: schema.decks.slug,
    })
    .from(schema.feeds)
    // Use INNER JOIN since we always filter by isDeleted = false, filtering earlier improves performance
    .innerJoin(
      schema.usersUrls,
      orm.and(orm.eq(schema.feeds.userUrlId, schema.usersUrls.id), orm.eq(schema.usersUrls.isDeleted, false)),
    )
    // INNER JOIN: usersUrls.urlId is NOT NULL with FK constraint - URL must exist
    .innerJoin(schema.urls, orm.eq(schema.usersUrls.urlId, schema.urls.id))
    .leftJoin(schema.userUrlsTags, orm.eq(schema.usersUrls.id, schema.userUrlsTags.userUrlId))
    .leftJoin(schema.tags, orm.eq(schema.userUrlsTags.tagId, schema.tags.id))
    // INNER JOIN: users who have feed entries must have profiles (business logic requirement)
    .innerJoin(schema.userProfiles, orm.eq(schema.usersUrls.userId, schema.userProfiles.userId))
    .leftJoin(schema.decks, orm.eq(schema.feeds.deckId, schema.decks.id))
    .groupBy(...groupBy)
    .orderBy(orm.desc(schema.feeds.createdAt));

  const userCondition = orm.eq(schema.feeds.userId, userId);
  const authorCondition = orm.eq(schema.userProfiles.userId, userId);

  if (viewerId) {
    // Note: interactionTypeId = 1 represents "LIKED" in the interaction_types table
    query.leftJoin(
      schema.usersUrlsInteractions,
      orm.and(
        orm.eq(schema.usersUrlsInteractions.userUrlId, schema.feeds.userUrlId),
        orm.eq(schema.usersUrlsInteractions.userId, viewerId),
        orm.eq(schema.usersUrlsInteractions.interactionTypeId, 1),
      ),
    );
  }

  // Build WHERE conditions with efficient tag filtering
  const baseTagCondition = includeTags
    ? orm.inArray(schema.feeds.userUrlId, orm.sql`(${createTagFilterSubquery(tagIds)})`)
    : undefined;

  // Deck filter condition - filter feed entries by specific deck
  const deckCondition = deckId ? orm.eq(schema.feeds.deckId, deckId) : undefined;

  // Note: isDeleted filter is now in the INNER JOIN condition above for better performance
  // No need to filter again in WHERE clause

  if (feedSource === "author") {
    query.where(
      orm.and(
        userCondition,
        authorCondition,
        baseTagCondition,
        deckCondition,
        cursor ? orm.lt(schema.feeds.createdAt, cursor) : undefined,
      ),
    );
  } else {
    query.where(
      orm.and(
        userCondition,
        baseTagCondition,
        deckCondition,
        cursor ? orm.lt(schema.feeds.createdAt, cursor) : undefined,
      ),
    );
  }

  query.limit(limit);

  // Debug logging - only in development
  if (process.env.NODE_ENV === "development") {
    const { sql, params } = query.toSQL();
    const formattedSQL = sql.replace(/\$(\d+)/g, (_, index) => {
      const value = params[parseInt(index, 10) - 1];
      return typeof value === "string" ? `'${value}'` : String(value);
    });
    console.log("getUserFeedQuery SQL:", formattedSQL);
  }

  return query;
};
