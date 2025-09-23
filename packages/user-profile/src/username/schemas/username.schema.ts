import z from "zod";

export const USERNAME_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ1234567890_";
export const USERNAME_MAX_LENGTH = 15;

export type UsernameSchema = z.infer<typeof usernameSchema>;

export const usernameSchema = z
  .string()
  .trim()
  .min(4, `Username cannot be shorter than 4 and longer than ${USERNAME_MAX_LENGTH} characters.`)
  .max(USERNAME_MAX_LENGTH, `Username cannot be shorter than 4 and longer than ${USERNAME_MAX_LENGTH} characters.`)
  .regex(new RegExp(`^[${USERNAME_ALPHABET}]+$`), `Only ${USERNAME_ALPHABET} characters allowed.`);
