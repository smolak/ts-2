import { type AddCategorySuccessResponse, addCategoryBodySchema } from "@workspace/category/api/v1/add-category.schema";
import type { GetCategoriesSuccessResponse } from "@workspace/category/api/v1/get-categories.schema";
import { getUserCategories } from "@workspace/category/db/operations";
import { db, schema } from "@workspace/db/db";
import { logger } from "@workspace/logger/logger";
import { generateRequestId } from "@workspace/request/id/generate-request-id";
import { StatusCodes } from "http-status-codes";

import { type CorsOptions, cors } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/get-user-id-from-request";

const corsOptions: CorsOptions = {
  methods: ["GET", "POST", "OPTIONS"],
  optionsSuccessStatus: StatusCodes.NO_CONTENT,
};

const ADD_CATEGORY_ACTION = "v1.category.addCategory";
const GET_CATEGORIES_ACTION = "v1.category.getCategories";

export async function GET(request: Request) {
  const requestId = generateRequestId();

  logger.info({ requestId, actionType: GET_CATEGORIES_ACTION }, "Getting categories.");

  const userId = await getUserIdFromRequest(request, requestId, GET_CATEGORIES_ACTION);

  if (!userId) {
    const response = new Response("User not authorized.", { status: StatusCodes.FORBIDDEN });

    return cors(request, response, corsOptions);
  }

  const categories = await getUserCategories(userId);

  logger.info({ requestId, actionType: GET_CATEGORIES_ACTION, categories }, "Categories retrieved.");

  const data: GetCategoriesSuccessResponse = { categories };
  const response = new Response(JSON.stringify(data), { status: StatusCodes.OK });

  return cors(request, response, corsOptions);
}

export async function POST(request: Request) {
  const requestId = generateRequestId();

  logger.info({ requestId, actionType: ADD_CATEGORY_ACTION }, "Adding category.");

  const userId = await getUserIdFromRequest(request, requestId, ADD_CATEGORY_ACTION);

  if (!userId) {
    return new Response("User not authorized.", { status: StatusCodes.FORBIDDEN });
  }

  const bodyResult = addCategoryBodySchema.safeParse(await request.json());

  if (!bodyResult.success) {
    logger.error({ requestId, actionType: ADD_CATEGORY_ACTION }, "Body validation error.");

    return new Response("Invalid body.", { status: StatusCodes.NOT_ACCEPTABLE });
  }

  const { name } = bodyResult.data;
  const maybeCategory = await db.query.categories.findFirst({
    where: (categories, { and, eq }) => and(eq(categories.userId, userId), eq(categories.name, name)),
  });

  if (maybeCategory) {
    logger.error({ requestId, name }, `Category (${name}) exists.`);

    return new Response("Category exists.", { status: StatusCodes.CONFLICT });
  }

  try {
    await db.insert(schema.categories).values({ userId, name });

    logger.info({ requestId, name }, "Category added.");

    const data: AddCategorySuccessResponse = { success: true };
    const response = new Response(JSON.stringify(data), { status: StatusCodes.CREATED });

    return cors(request, response, corsOptions);
  } catch (error) {
    logger.error({ requestId, actionType: ADD_CATEGORY_ACTION, error }, "Failed to add category.");

    return new Response("Failed to add category.", { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

export async function OPTIONS(request: Request) {
  return cors(request, new Response(null, { status: corsOptions.optionsSuccessStatus }), corsOptions);
}
