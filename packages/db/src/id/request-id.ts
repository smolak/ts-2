import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";

export const REQUEST_ID_PREFIX = "req_";
export const REQUEST_ID_LENGTH = DEFAULT_ID_LENGTH + REQUEST_ID_PREFIX.length;

export const generateRequestId = () => generateId(REQUEST_ID_PREFIX);
export type RequestId = ReturnType<typeof generateRequestId>;
