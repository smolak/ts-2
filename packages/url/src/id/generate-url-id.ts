import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";

export const URL_ID_PREFIX = "url_" as const;
export const URL_ID_LENGTH = DEFAULT_ID_LENGTH + URL_ID_PREFIX.length;

export const generateUrlId = (): string => generateId(URL_ID_PREFIX);
