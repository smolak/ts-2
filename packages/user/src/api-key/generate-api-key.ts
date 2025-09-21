import { generateId } from "@repo/shared/utils/generate-id";

export const API_KEY_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ1234567890_";
export const API_KEY_LENGTH = 30;

export const generateApiKey = () => generateId("", API_KEY_LENGTH, API_KEY_ALPHABET);
