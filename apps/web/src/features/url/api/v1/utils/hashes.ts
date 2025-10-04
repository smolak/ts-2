import { sha256, sha1 } from "@workspace/crypto/hash";
import { AddUrlRequestBody } from "../add-url/request-body.schema";

export const createCompoundHash = (metadata: AddUrlRequestBody["metadata"]): string => {
  const compoundHashData = `${metadata.url}${metadata.title || ""}${metadata.imageUrl || ""}`.trim();

  return sha256(compoundHashData);
};

export const createUrlHash = sha1;
