import { z } from "zod";

const MAX_URL_LENGTH = 500;

// TODO: add removing utm and alike query params...
export const urlSchema = z
  .url()
  .startsWith("https://", { message: "Only https:// URLs allowed." })
  .trim()
  .max(MAX_URL_LENGTH);
