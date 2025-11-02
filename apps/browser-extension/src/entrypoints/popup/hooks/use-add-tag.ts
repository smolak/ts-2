import type { AddTagBody, AddTagSuccessResponse } from "@repo/tag/api/v1/add-tag.schema";
import { useMutation } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";

import { API_BASE_URL } from "../utils/constants";

export const useAddTag = (apiKey: string, onSuccess?: () => void) => {
  return useMutation<AddTagSuccessResponse, AxiosError, AddTagBody>({
    mutationFn: (data: AddTagBody): Promise<AddTagSuccessResponse> => {
      return axios.post(`${API_BASE_URL}/v1/tag`, data, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    },
    onSuccess,
  });
};
