import { db, orm, schema } from "@repo/db/db";
import type { Feed, Tag, User } from "@repo/db/types";

import type { FeedSourceValue } from "../shared/feed-source";

type GetUserFeedQueryOptions = {
  userId: User["id"];
  viewerId?: User["id"];
  limit: number;
  cursor?: Feed["createdAt"];
  feedSource?: FeedSourceValue;
  tagIds: Tag["id"][];
};

/**
 * Creates a subquery to efficiently filter user_urls that have ALL specified tags.
 * This approach filters early (before joins) to reduce intermediate result set size.
 */
const createTagFilterSubquery = (tagIds: Tag["id"][]) => {
  return db
    .select({ userUrlId: schema.userUrlsTags.userUrlId })
    .from(schema.userUrlsTags)
    .where(orm.inArray(schema.userUrlsTags.tagId, tagIds))
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
  ];

  const groupBy = viewerId ? [...baseGroupBy, schema.usersUrlsInteractions.userId] : baseGroupBy;

  // Build query with conditional tag joins to avoid unnecessary joins when filtering by tags
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
    })
    .from(schema.feeds)
    .leftJoin(schema.usersUrls, orm.eq(schema.feeds.userUrlId, schema.usersUrls.id))
    .leftJoin(schema.urls, orm.eq(schema.usersUrls.urlId, schema.urls.id))
    .leftJoin(schema.userProfiles, orm.eq(schema.usersUrls.userId, schema.userProfiles.userId));

  // Only join tags tables if NOT filtering (when filtering, we use the subquery for efficiency)
  if (!includeTags) {
    query
      .leftJoin(schema.userUrlsTags, orm.eq(schema.usersUrls.id, schema.userUrlsTags.userUrlId))
      .leftJoin(schema.tags, orm.eq(schema.userUrlsTags.tagId, schema.tags.id));
  }

  query.groupBy(...groupBy).orderBy(orm.desc(schema.feeds.createdAt));

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

  if (feedSource === "author") {
    query.where(
      orm.and(
        userCondition,
        authorCondition,
        baseTagCondition,
        cursor ? orm.lt(schema.feeds.createdAt, cursor) : undefined,
      ),
    );
  } else {
    query.where(
      orm.and(userCondition, baseTagCondition, cursor ? orm.lt(schema.feeds.createdAt, cursor) : undefined),
    );
  }

  query.limit(limit);

  // Uncomment to debug generated SQL query and verify query plan
  const { sql, params } = query.toSQL();

  const formattedSQL = sql.replace(/\$(\d+)/g, (_, index) => {
    const value = params[parseInt(index, 10) - 1]; // Convert 1-based index to 0-based
    return typeof value === "string" ? `'${value}'` : String(value);
  });

  console.log("getUserFeedQuery SQL:", formattedSQL);

  return query;
};
