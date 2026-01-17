import { orm, schema } from "@repo/db/db";
import { deckIdSchema } from "@repo/db/id/deck-id";
import { tagIdSchema } from "@repo/db/id/tag-id";
import type { UserUrlId } from "@repo/db/id/user-url-id";
import type { Tag, Url, UserUrl } from "@repo/db/types";
import type { DeckMetadata } from "@repo/deck/schemas/deck-metadata.schema";
import type { Maybe } from "@repo/shared/types";
import { z } from "zod";

import { publicProcedure } from "@/server/api/trpc";

const getDeckUrlsSchema = z.object({
  deckId: deckIdSchema,
  tagIds: z.array(tagIdSchema).optional().default([]),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type GetDeckUrlsSchema = z.infer<typeof getDeckUrlsSchema>;

type DeckUrlItem = {
  userUrlId: UserUrlId;
  url: Url["url"];
  metadata: Url["metadata"];
  addedAt: Date;
  likesCount: UserUrl["likesCount"];
  tagNames: Tag["displayName"][];
};

type GetDeckUrlsResult = Maybe<{
  deckMetadata: DeckMetadata;
  items: DeckUrlItem[];
  nextCursor: string | null;
}>;

export const getDeckUrls = publicProcedure
  .input(getDeckUrlsSchema)
  .query<GetDeckUrlsResult>(
    async ({ input: { deckId, tagIds, limit, cursor }, ctx: { logger, requestId, db, auth } }) => {
      const path = "deck.getDeckUrls";

      logger.info({ requestId, path, deckId, tagIds, limit, cursor }, "Fetching deck URLs.");

      // 1. Get the deck and viewer in parallel (independent queries)
      const [deck, viewer] = await Promise.all([
        db.query.decks.findFirst({
          where: (decks, { eq }) => eq(decks.id, deckId),
          columns: { id: true, isPublic: true, userId: true, scheduledForDeletionAt: true, metadata: true },
        }),
        auth.userId
          ? db.query.users.findFirst({
              where: (users, { eq }) => eq(users.clerkUserId, auth.userId),
              columns: { id: true },
            })
          : Promise.resolve(null),
      ]);

      if (!deck) {
        logger.info({ requestId, path, deckId }, "Deck not found.");
        return null;
      }

      // 2. Check if viewer can see this deck
      const viewerUserId = viewer?.id ?? null;
      const isOwner = viewerUserId === deck.userId;

      if (!deck.isPublic && !isOwner) {
        logger.info({ requestId, path, deckId }, "Deck is private and viewer is not owner.");
        return null;
      }

      // 3. Hide pending-deletion decks from non-owners
      if (deck.scheduledForDeletionAt && !isOwner) {
        logger.info({ requestId, path, deckId }, "Deck is pending deletion and viewer is not owner.");
        return null;
      }

      // 4. Build WHERE conditions for the main query
      const whereConditions: ReturnType<typeof orm.eq>[] = [orm.eq(schema.deckUrls.deckId, deckId)];

      if (cursor) {
        whereConditions.push(orm.lt(schema.deckUrls.addedAt, new Date(cursor)));
      }

      // 5. Add tag filter using EXISTS subquery (avoids loading all IDs into memory)
      // This filters URLs that have ALL specified tags
      if (tagIds.length > 0) {
        const tagFilterSubquery = orm.exists(
          db
            .select({ one: orm.sql`1` })
            .from(schema.deckUrlsTags)
            .where(
              orm.and(
                orm.eq(schema.deckUrlsTags.deckId, schema.deckUrls.deckId),
                orm.eq(schema.deckUrlsTags.userUrlId, schema.deckUrls.userUrlId),
                orm.inArray(schema.deckUrlsTags.tagId, tagIds),
              ),
            )
            .groupBy(schema.deckUrlsTags.userUrlId)
            .having(orm.sql`COUNT(DISTINCT ${schema.deckUrlsTags.tagId}) = ${tagIds.length}`),
        );
        whereConditions.push(tagFilterSubquery);
      }

      // 6. Fetch deck URLs with tags aggregated via STRING_AGG (single query)
      const deckUrlsWithDetails = await db
        .select({
          addedAt: schema.deckUrls.addedAt,
          userUrlId: schema.usersUrls.id,
          likesCount: schema.usersUrls.likesCount,
          url: schema.urls.url,
          metadata: schema.urls.metadata,
          // Aggregate tags into comma-separated string using STRING_AGG
          tagNamesAgg: orm.sql<
            string | null
          >`STRING_AGG(${schema.tags.displayName}, ',' ORDER BY ${schema.tags.displayName})`,
        })
        .from(schema.deckUrls)
        .innerJoin(schema.usersUrls, orm.eq(schema.deckUrls.userUrlId, schema.usersUrls.id))
        .innerJoin(schema.urls, orm.eq(schema.usersUrls.urlId, schema.urls.id))
        // LEFT JOIN for tags - some URLs may have no tags
        .leftJoin(
          schema.deckUrlsTags,
          orm.and(
            orm.eq(schema.deckUrls.deckId, schema.deckUrlsTags.deckId),
            orm.eq(schema.deckUrls.userUrlId, schema.deckUrlsTags.userUrlId),
          ),
        )
        .leftJoin(schema.tags, orm.eq(schema.deckUrlsTags.tagId, schema.tags.id))
        .where(orm.and(...whereConditions))
        .groupBy(
          schema.deckUrls.addedAt,
          schema.usersUrls.id,
          schema.usersUrls.likesCount,
          schema.urls.url,
          schema.urls.metadata,
        )
        .orderBy(orm.desc(schema.deckUrls.addedAt))
        .limit(limit + 1);

      // 7. Determine next cursor
      const hasMore = deckUrlsWithDetails.length > limit;
      const items = hasMore ? deckUrlsWithDetails.slice(0, limit) : deckUrlsWithDetails;
      const nextCursor = hasMore ? (items[items.length - 1]?.addedAt.toISOString() ?? null) : null;

      logger.info({ requestId, path, deckId, count: items.length, hasMore }, "Deck URLs fetched.");

      return {
        deckMetadata: deck.metadata as DeckMetadata,
        items: items.map((item) => ({
          userUrlId: item.userUrlId,
          url: item.url,
          metadata: item.metadata,
          addedAt: item.addedAt,
          likesCount: item.likesCount,
          // Parse comma-separated tags back into array
          tagNames: item.tagNamesAgg ? item.tagNamesAgg.split(",") : [],
        })),
        nextCursor,
      };
    },
  );
