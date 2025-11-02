import type { GetTagsSuccessResponse } from "@repo/tag/api/v1/get-tags.schema";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

export const useTags = (apiKey: string) =>
  useQuery({ queryKey: ["tags"], queryFn: () => getCategories(apiKey) });

const getCategories = async (apiKey: string): Promise<TagDto[]> => {
  const { data } = await axios.get<GetTagsSuccessResponse>(`${API_BASE_URL}/v1/tag`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  console.log("fetched tags", data.tags);

  return data.tags;
};
