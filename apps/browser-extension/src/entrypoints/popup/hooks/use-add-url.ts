import type { DeckId } from "@repo/db/id/deck-id";
import type { TagId } from "@repo/db/id/tag-id";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import type { ApiKey } from "@repo/user/api-key/api-key.schema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

type AddUrlParams = {
  metadata: ScrappedMetadata;
  tagIds: TagId[];
  deckId: DeckId;
};

export const useAddUrl = (apiKey: ApiKey) =>
  useMutation({
    mutationFn: ({ metadata, tagIds, deckId }: AddUrlParams) =>
      axios.post(
        `${API_BASE_URL}/v1/url`,
        { metadata, tagIds, deckId },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
  });
