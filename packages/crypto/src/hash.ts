import { createHash } from "node:crypto";

export const sha1 = (string: string): string => createHash("sha1").update(string).digest("hex");
export const sha256 = (string: string): string => createHash("sha256").update(string).digest("hex");
