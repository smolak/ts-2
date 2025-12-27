import type { GetDecksSuccessResponse } from "@repo/deck/api/v1/get-decks.schema";
import type { DeckDto } from "@repo/deck/dto/deck.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

export const useDecks = (apiKey: string) => useQuery({ queryKey: ["decks"], queryFn: () => getDecks(apiKey) });

const getDecks = async (apiKey: string): Promise<DeckDto[]> => {
  const { data } = await axios.get<GetDecksSuccessResponse>(`${API_BASE_URL}/v1/deck`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return data.decks;
};
