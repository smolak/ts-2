import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "../../packages/tests-setup/src/index.ts",
    hookTimeout: 20_000, // Increased for database connection cold starts
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mock server-only package for vitest
      "server-only": path.resolve(__dirname, "./src/test-utils/server-only-mock.ts"),
    },
  },
});
