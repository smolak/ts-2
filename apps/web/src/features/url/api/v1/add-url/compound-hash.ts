import { sha1, sha256 } from "@repo/crypto/hash";
import type { AddUrlRequestBody } from "../add-url/request-body.schema";

export const createCompoundHash = (metadata: AddUrlRequestBody["metadata"]): string => {
  const compoundHashData =
    `${metadata.url}${metadata.title || ""}${metadata.imageUrl || ""}${metadata.description || ""}`.trim();

  return sha256(compoundHashData);
};

export const createUrlHash = sha1;
