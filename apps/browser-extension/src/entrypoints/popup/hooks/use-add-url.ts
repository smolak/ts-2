import type { CategoryId } from "@repo/db/id/category-id";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import type { ApiKey } from "@repo/user/api-key/api-key.schema";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

export const useAddUrl = (apiKey: ApiKey) =>
  useMutation({
    mutationFn: ({ metadata, categoryIds }: { metadata: ScrappedMetadata; categoryIds: CategoryId[] }) =>
      axios.post(
        `${API_BASE_URL}/v1/url`,
        { metadata, categoryIds },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
  });
