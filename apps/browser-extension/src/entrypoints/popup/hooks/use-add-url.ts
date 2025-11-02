import type { TagId } from "@repo/db/id/tag-id";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import type { ApiKey } from "@repo/user/api-key/api-key.schema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

export const useAddUrl = (apiKey: ApiKey) =>
  useMutation({
    mutationFn: ({ metadata, tagIds }: { metadata: ScrappedMetadata; tagIds: TagId[] }) =>
      axios.post(
        `${API_BASE_URL}/v1/url`,
        { metadata, tagIds },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
  });
