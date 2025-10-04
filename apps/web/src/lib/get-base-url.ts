import { env } from "@/env";

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;

  if (env.NODE_ENV !== "development") return `https://${env.NEXT_PUBLIC_SUPABASE_URL}`;

  return "http://localhost:3000";
}
