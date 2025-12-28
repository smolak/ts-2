import { orm, schema } from "@repo/db/db";
import { deckIdSchema } from "@repo/db/id/deck-id";
import { tagIdSchema } from "@repo/db/id/tag-id";
import type { Tag, Url, UserUrl } from "@repo/db/types";
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
  userUrlId: UserUrl["id"];
  url: Url["url"];
  metadata: Url["metadata"];
  addedAt: Date;
  likesCount: UserUrl["likesCount"];
  tagNames: Tag["displayName"][];
};

type GetDeckUrlsResult = {
  items: DeckUrlItem[];
  nextCursor: string | null;
} | null;

export const getDeckUrls = publicProcedure
  .input(getDeckUrlsSchema)
  .query<GetDeckUrlsResult>(
    async ({ input: { deckId, tagIds, limit, cursor }, ctx: { logger, requestId, db, auth } }) => {
      const path = "deck.getDeckUrls";

      logger.info({ requestId, path, deckId, tagIds, limit, cursor }, "Fetching deck URLs.");

      // 1. Get the deck and check visibility
      const deck = await db.query.decks.findFirst({
        where: (decks, { eq }) => eq(decks.id, deckId),
        columns: { id: true, isPublic: true, userId: true, scheduledForDeletionAt: true },
      });

      if (!deck) {
        logger.info({ requestId, path, deckId }, "Deck not found.");
        return null;
      }

      // 2. Check if viewer can see this deck
      let viewerUserId: string | null = null;

      if (auth.userId) {
        const viewer = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.clerkUserId, auth.userId),
          columns: { id: true },
        });

        viewerUserId = viewer?.id ?? null;
      }

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

      // 4. Build tag filter subquery if tagIds are provided
      const hasTagFilter = tagIds.length > 0;

      // Get userUrlIds that have ALL specified tags for this deck
      let filteredUserUrlIds: string[] | null = null;

      if (hasTagFilter) {
        const matchingDeckUrls = await db
          .select({ userUrlId: schema.deckUrlsTags.userUrlId })
          .from(schema.deckUrlsTags)
          .where(orm.and(orm.eq(schema.deckUrlsTags.deckId, deckId), orm.inArray(schema.deckUrlsTags.tagId, tagIds)))
          .groupBy(schema.deckUrlsTags.userUrlId)
          .having(orm.sql`COUNT(DISTINCT ${schema.deckUrlsTags.tagId}) = ${tagIds.length}`);

        filteredUserUrlIds = matchingDeckUrls.map((r) => r.userUrlId);

        // If no URLs match the tag filter, return empty result
        if (filteredUserUrlIds.length === 0) {
          logger.info({ requestId, path, deckId, tagIds }, "No URLs match tag filter.");
          return { items: [], nextCursor: null };
        }
      }

      // 5. Fetch deck URLs with cursor-based pagination
      const deckUrlsWithDetails = await db.query.deckUrls.findMany({
        where: (deckUrls, { eq, and, lt, inArray }) => {
          const conditions = [eq(deckUrls.deckId, deckId)];
          if (cursor) {
            conditions.push(lt(deckUrls.addedAt, new Date(cursor)));
          }
          if (filteredUserUrlIds) {
            conditions.push(inArray(deckUrls.userUrlId, filteredUserUrlIds));
          }
          return and(...conditions);
        },
        with: {
          userUrl: {
            columns: { id: true, likesCount: true, isDeleted: true },
            with: {
              url: {
                columns: { url: true, metadata: true },
              },
            },
          },
        },
        orderBy: (deckUrls, { desc }) => [desc(deckUrls.addedAt)],
        limit: limit + 1, // Fetch one extra for cursor
      });

      // 6. Filter out deleted URLs
      const activeUrls = deckUrlsWithDetails.filter((du) => !du.userUrl.isDeleted);

      // 7. Determine next cursor
      const hasMore = activeUrls.length > limit;
      const items = hasMore ? activeUrls.slice(0, limit) : activeUrls;
      const nextCursor = hasMore ? (items[items.length - 1]?.addedAt.toISOString() ?? null) : null;

      // 8. Fetch tags for each deck-URL
      const userUrlIds = items.map((du) => du.userUrl.id);
      const deckUrlTags =
        userUrlIds.length > 0
          ? await db.query.deckUrlsTags.findMany({
              where: (dut, { and, eq, inArray }) => and(eq(dut.deckId, deckId), inArray(dut.userUrlId, userUrlIds)),
              with: {
                tag: {
                  columns: { id: true, displayName: true },
                },
              },
            })
          : [];

      // Group tags by userUrlId
      const tagsByUserUrlId = new Map<string, string[]>();
      for (const dut of deckUrlTags) {
        const existing = tagsByUserUrlId.get(dut.userUrlId) ?? [];
        existing.push(dut.tag.displayName);
        tagsByUserUrlId.set(dut.userUrlId, existing);
      }

      logger.info({ requestId, path, deckId, count: items.length, hasMore }, "Deck URLs fetched.");

      return {
        items: items.map((du) => ({
          userUrlId: du.userUrl.id,
          url: du.userUrl.url.url,
          metadata: du.userUrl.url.metadata,
          addedAt: du.addedAt,
          likesCount: du.userUrl.likesCount,
          tagNames: tagsByUserUrlId.get(du.userUrl.id) ?? [],
        })),
        nextCursor,
      };
    },
  );
