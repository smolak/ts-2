import { customAlphabet } from "nanoid";

export const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ1234567890";

// 22 size and above alphabet allows for the same randomness as uuid
export const DEFAULT_ID_LENGTH = 22;

export const generateId = (prefix = "", size = DEFAULT_ID_LENGTH, alphabet = ALPHABET) =>
  `${prefix}${customAlphabet(alphabet, size)()}`;
