import { sha256 } from "@workspace/crypto/hash";
import { AddUrlRequestBody } from "./request-body.schema";

export const createCompoundHash = (metadata: AddUrlRequestBody["metadata"]): string => {
  const compoundHashData =
    `${metadata.url}${metadata.title || ""}${metadata.imageUrl || ""}${metadata.description || ""}`.trim();

  return sha256(compoundHashData);
};
