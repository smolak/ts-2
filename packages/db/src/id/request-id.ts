import { DEFAULT_ID_LENGTH, generateId } from "@repo/shared/utils/generate-id";
import { z } from "zod";

export const REQUEST_ID_PREFIX = "req_" as const;
export const REQUEST_ID_LENGTH = DEFAULT_ID_LENGTH + REQUEST_ID_PREFIX.length;

/**
 * Branded type for Request IDs.
 *
 * This type ensures compile-time safety - you cannot pass a plain `string`
 * or another entity ID where a `RequestId` is expected.
 */
declare const RequestIdBrand: unique symbol;
export type RequestId = string & { readonly [RequestIdBrand]: typeof RequestIdBrand };

export const generateRequestId = (): RequestId => generateId(REQUEST_ID_PREFIX) as RequestId;

export const requestIdSchema = z
  .string()
  .trim()
  .startsWith(REQUEST_ID_PREFIX, { message: "ID passed is not a request ID." })
  .length(REQUEST_ID_LENGTH, { message: "Wrong ID size." })
  .refine((val): val is RequestId => true);
