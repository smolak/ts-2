import type { GetCategoriesSuccessResponse } from "@repo/category/api/v1/get-categories.schema";
import type { CategoryDto } from "@repo/category/dto/category.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { API_BASE_URL } from "../utils/constants";

export const useCategories = (apiKey: string) =>
  useQuery({ queryKey: ["categories"], queryFn: () => getCategories(apiKey) });

const getCategories = async (apiKey: string): Promise<CategoryDto[]> => {
  const { data } = await axios.get<GetCategoriesSuccessResponse>(`${API_BASE_URL}/v1/category`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  console.log("fetched categories", data.categories);

  return data.categories;
};
