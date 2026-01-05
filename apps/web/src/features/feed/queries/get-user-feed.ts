import { db, orm, schema } from "@repo/db/db";
import type { Deck, Feed, User } from "@repo/db/types";

import type { FeedSourceValue } from "../shared/feed-source";

type GetUserFeedQueryOptions = {
  userId: User["id"];
  viewerId?: User["id"];
  limit: number;
  cursor?: Feed["createdAt"];
  feedSource?: FeedSourceValue;
  deckId?: Deck["id"];
};

export const getUserFeedQuery = ({ userId, viewerId, limit, cursor, feedSource, deckId }: GetUserFeedQueryOptions) => {
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
    // Note: decks.metadata is NOT in GROUP BY - we use MIN() aggregate instead
    // since it's functionally dependent on decks.id (already grouped)
  ];

  const groupBy = viewerId ? [...baseGroupBy, schema.usersUrlsInteractions.userId] : baseGroupBy;

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
      // Tags are now per deck-URL - show displayName from tags in this deck
      tag_names: orm.sql<
        string | null
      >`STRING_AGG(DISTINCT ${schema.tags.displayName}, ', ' ORDER BY ${schema.tags.displayName})`,
      deck_id: schema.decks.id,
      deck_name: schema.decks.name,
      deck_slug: schema.decks.slug,
      // Use (array_agg(...))[1] since metadata is functionally dependent on decks.id
      // This avoids expensive JSONB comparison in GROUP BY (MIN doesn't work on JSONB)
      deck_metadata: orm.sql<typeof schema.decks.metadata>`(array_agg(${schema.decks.metadata}))[1]`,
    })
    .from(schema.feeds)
    // INNER JOIN: feeds.deckId is now NOT NULL, deck must exist
    .innerJoin(schema.decks, orm.eq(schema.feeds.deckId, schema.decks.id))
    // INNER JOIN: feeds.userUrlId references usersUrls - URL must exist
    .innerJoin(schema.usersUrls, orm.eq(schema.feeds.userUrlId, schema.usersUrls.id))
    // INNER JOIN: usersUrls.urlId is NOT NULL with FK constraint - URL must exist
    .innerJoin(schema.urls, orm.eq(schema.usersUrls.urlId, schema.urls.id))
    // Tags are now per deck-URL via deckUrlsTags - used only for displaying tag names on feed items
    .leftJoin(
      schema.deckUrlsTags,
      orm.and(
        orm.eq(schema.feeds.deckId, schema.deckUrlsTags.deckId),
        orm.eq(schema.feeds.userUrlId, schema.deckUrlsTags.userUrlId),
      ),
    )
    .leftJoin(schema.tags, orm.eq(schema.deckUrlsTags.tagId, schema.tags.id))
    // INNER JOIN: users who have feed entries must have profiles (business logic requirement)
    .innerJoin(schema.userProfiles, orm.eq(schema.usersUrls.userId, schema.userProfiles.userId))
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

  // Deck filter condition - filter feed entries by specific deck
  const deckConditionWhere = deckId ? orm.eq(schema.feeds.deckId, deckId) : undefined;

  if (feedSource === "author") {
    query.where(
      orm.and(
        userCondition,
        authorCondition,
        deckConditionWhere,
        cursor ? orm.lt(schema.feeds.createdAt, cursor) : undefined,
      ),
    );
  } else {
    query.where(
      orm.and(userCondition, deckConditionWhere, cursor ? orm.lt(schema.feeds.createdAt, cursor) : undefined),
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
