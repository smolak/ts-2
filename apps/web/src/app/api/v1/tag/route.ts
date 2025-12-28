import { db, schema } from "@repo/db/db";
import { type DeckId, deckIdSchema } from "@repo/db/id/deck-id";
import { generateRequestId } from "@repo/db/id/request-id";
import { type AddTagSuccessResponse, addTagBodySchema } from "@repo/tag/api/v1/add-tag.schema";
import type { GetTagsSuccessResponse } from "@repo/tag/api/v1/get-tags.schema";
import { StatusCodes } from "http-status-codes";
import { logger } from "@/features/logger";
import { type CorsOptions, cors } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/get-user-id-from-request";

const corsOptions: CorsOptions = {
  methods: ["GET", "POST", "OPTIONS"],
  optionsSuccessStatus: StatusCodes.NO_CONTENT,
};

const ADD_TAG_ACTION = "v1.tag.addTag";
const GET_TAGS_ACTION = "v1.tag.getTags";

export async function GET(request: Request) {
  const requestId = generateRequestId();
  const url = new URL(request.url);
  const deckIdParam = url.searchParams.get("deckId");

  logger.info({ requestId, actionType: GET_TAGS_ACTION, deckIdParam }, "Getting tags.");

  const userId = await getUserIdFromRequest(request, requestId, GET_TAGS_ACTION);

  if (!userId) {
    const response = new Response("User not authorized.", { status: StatusCodes.FORBIDDEN });
    return cors(request, response, corsOptions);
  }

  // Validate deckId parameter
  if (!deckIdParam) {
    const response = new Response("Missing deckId parameter.", { status: StatusCodes.BAD_REQUEST });
    return cors(request, response, corsOptions);
  }

  const deckIdResult = deckIdSchema.safeParse(deckIdParam);
  if (!deckIdResult.success) {
    const response = new Response("Invalid deckId parameter.", { status: StatusCodes.BAD_REQUEST });
    return cors(request, response, corsOptions);
  }

  const deckId: DeckId = deckIdResult.data;

  // Verify deck belongs to user
  const deck = await db.query.decks.findFirst({
    where: (decks, { and, eq, isNull }) =>
      and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
    columns: { id: true },
  });

  if (!deck) {
    const response = new Response("Deck not found.", { status: StatusCodes.NOT_FOUND });
    return cors(request, response, corsOptions);
  }

  const tags = await db.query.tags.findMany({
    columns: {
      id: true,
      name: true,
      displayName: true,
      urlsCount: true,
    },
    where: (tags, { eq }) => eq(tags.deckId, deckId),
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });

  logger.info({ requestId, actionType: GET_TAGS_ACTION, deckId, count: tags.length }, "Tags retrieved.");

  const data: GetTagsSuccessResponse = { tags };
  const response = new Response(JSON.stringify(data), { status: StatusCodes.OK });

  return cors(request, response, corsOptions);
}

/**
 * POST /api/v1/tag
 * Create a tag for a specific deck. Requires deckId and name in body.
 */
export async function POST(request: Request) {
  const requestId = generateRequestId();

  logger.info({ requestId, actionType: ADD_TAG_ACTION }, "Adding tag.");

  const userId = await getUserIdFromRequest(request, requestId, ADD_TAG_ACTION);

  if (!userId) {
    return new Response("User not authorized.", { status: StatusCodes.FORBIDDEN });
  }

  const bodyResult = addTagBodySchema.safeParse(await request.json());

  if (!bodyResult.success) {
    logger.error({ requestId, actionType: ADD_TAG_ACTION }, "Body validation error.");
    return new Response("Invalid body.", { status: StatusCodes.NOT_ACCEPTABLE });
  }

  const { deckId, name: displayName } = bodyResult.data;
  const name = displayName.toLowerCase().trim(); // Normalized name for uniqueness

  // Verify deck belongs to user
  const deck = await db.query.decks.findFirst({
    where: (decks, { and, eq, isNull }) =>
      and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.scheduledForDeletionAt)),
    columns: { id: true },
  });

  if (!deck) {
    logger.error({ requestId, deckId }, "Deck not found or not owned by user.");
    return new Response("Deck not found.", { status: StatusCodes.NOT_FOUND });
  }

  // Check if tag already exists in this deck
  const maybeTag = await db.query.tags.findFirst({
    where: (tags, { and, eq }) => and(eq(tags.deckId, deckId), eq(tags.name, name)),
  });

  if (maybeTag) {
    logger.error({ requestId, deckId, name }, `Tag (${name}) already exists in deck.`);
    return new Response("Tag already exists in this deck.", { status: StatusCodes.CONFLICT });
  }

  try {
    const [result] = await db
      .insert(schema.tags)
      .values({ deckId, name, displayName })
      .returning({ id: schema.tags.id });

    logger.info({ requestId, deckId, name, displayName, tagId: result?.id }, "Tag added.");

    const data: AddTagSuccessResponse = { success: true, tagId: result?.id };
    const response = new Response(JSON.stringify(data), { status: StatusCodes.CREATED });

    return cors(request, response, corsOptions);
  } catch (error) {
    logger.error({ requestId, actionType: ADD_TAG_ACTION, error }, "Failed to add tag.");
    return new Response("Failed to add tag.", { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

export async function OPTIONS(request: Request) {
  return cors(request, new Response(null, { status: corsOptions.optionsSuccessStatus }), corsOptions);
}
