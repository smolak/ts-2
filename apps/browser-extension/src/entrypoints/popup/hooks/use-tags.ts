import type { DeckId } from "@repo/db/id/deck-id";
import type { GetTagsSuccessResponse } from "@repo/tag/api/v1/get-tags.schema";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { skipToken, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

/**
 * Fetches tags for a specific deck.
 * Tags are now per-deck, so deckId is required.
 */
export const useTags = (apiKey: string, deckId: DeckId | null) =>
  useQuery({
    queryKey: ["tags", deckId],
    queryFn: deckId !== null ? () => getTags(apiKey, deckId) : skipToken,
  });

const getTags = async (apiKey: string, deckId: DeckId): Promise<TagDto[]> => {
  const { data } = await axios.get<GetTagsSuccessResponse>(`${API_BASE_URL}/v1/tag?deckId=${deckId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  console.log("fetched tags for deck", deckId, data.tags);

  return data.tags;
};
