import { type AddTagSuccessResponse, addTagBodySchema } from "@repo/tag/api/v1/add-tag.schema";
import type { GetTagsSuccessResponse } from "@repo/tag/api/v1/get-tags.schema";
import { db, schema } from "@repo/db/db";
import { generateRequestId } from "@repo/db/id/request-id";
import { StatusCodes } from "http-status-codes";
import { getUserTags } from "@/features/tag/router/procedures/get-user-tags";
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

  logger.info({ requestId, actionType: GET_TAGS_ACTION }, "Getting tags.");

  const userId = await getUserIdFromRequest(request, requestId, GET_TAGS_ACTION);

  if (!userId) {
    const response = new Response("User not authorized.", { status: StatusCodes.FORBIDDEN });

    return cors(request, response, corsOptions);
  }

  const tags = await db.query.tags.findMany({
    columns: {
      id: true,
      name: true,
      urlsCount: true,
    },
    where: (tags, { eq }) => eq(tags.userId, userId),
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });

  // const tags = await getUserTags();

  logger.info({ requestId, actionType: GET_TAGS_ACTION, tags }, "Tags retrieved.");

  const data: GetTagsSuccessResponse = { tags };
  const response = new Response(JSON.stringify(data), { status: StatusCodes.OK });

  return cors(request, response, corsOptions);
}

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

  const { name } = bodyResult.data;
  const maybeTag = await db.query.tags.findFirst({
    where: (tags, { and, eq }) => and(eq(tags.userId, userId), eq(tags.name, name)),
  });

  if (maybeTag) {
    logger.error({ requestId, name }, `Tag (${name}) exists.`);

    return new Response("Tag exists.", { status: StatusCodes.CONFLICT });
  }

  try {
    await db.insert(schema.tags).values({ userId, name });

    logger.info({ requestId, name }, "Tag added.");

    const data: AddTagSuccessResponse = { success: true };
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
