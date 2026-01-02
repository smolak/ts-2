import { db } from "@repo/db/db";
import { generateRequestId } from "@repo/db/id/request-id";
import type { GetDecksSuccessResponse } from "@repo/deck/api/v1/get-decks.schema";
import { toDeckDto } from "@repo/deck/dto/deck.dto";
import { StatusCodes } from "http-status-codes";

import { getUserDecks } from "@/features/deck/services/get-user-decks";
import { logger } from "@/features/logger";
import { type CorsOptions, cors } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/get-user-id-from-request";

const corsOptions: CorsOptions = {
  methods: ["GET", "OPTIONS"],
  optionsSuccessStatus: StatusCodes.NO_CONTENT,
};

const GET_DECKS_ACTION = "v1.deck.getDecks";

export async function GET(request: Request) {
  const requestId = generateRequestId();

  logger.info({ requestId, actionType: GET_DECKS_ACTION }, "Getting decks.");

  const userId = await getUserIdFromRequest(request, requestId, GET_DECKS_ACTION);

  if (!userId) {
    const response = new Response("User not authorized.", { status: StatusCodes.FORBIDDEN });

    return cors(request, response, corsOptions);
  }

  const decks = await getUserDecks({ db, userId });

  logger.info({ requestId, actionType: GET_DECKS_ACTION, count: decks.length }, "Decks retrieved.");

  const data: GetDecksSuccessResponse = { decks: decks.map(toDeckDto) };
  const response = new Response(JSON.stringify(data), { status: StatusCodes.OK });

  return cors(request, response, corsOptions);
}

export async function OPTIONS(request: Request) {
  return cors(request, new Response(null, { status: corsOptions.optionsSuccessStatus }), corsOptions);
}
