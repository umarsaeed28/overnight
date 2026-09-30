import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "unit",
      include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts"],
      exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
      environment: "node",
    },
  },
  {
    // The landing page renders to static markup, so it needs JSX but no DOM.
    test: {
      name: "site",
      include: ["apps/site/tests/**/*.test.tsx"],
      exclude: ["**/node_modules/**"],
      environment: "node",
    },
    esbuild: { jsx: "automatic" },
  },
  {
    test: {
      name: "integration",
      include: ["packages/**/*.integration.test.ts", "apps/**/*.integration.test.ts"],
      exclude: ["**/node_modules/**"],
      environment: "node",
      testTimeout: 180_000,
      hookTimeout: 180_000,
    },
  },
]);
