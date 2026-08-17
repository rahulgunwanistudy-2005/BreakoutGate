import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@youcam": path.resolve(__dirname, "./packages/youcam"),
      "@contracts": path.resolve(__dirname, "./packages/contracts"),
      "@evidence": path.resolve(__dirname, "./packages/evidence"),
      "@engine": path.resolve(__dirname, "./packages/engine"),
      "@receipt": path.resolve(__dirname, "./packages/receipt"),
      "@orchestration": path.resolve(__dirname, "./packages/orchestration"),
    },
  },
});
