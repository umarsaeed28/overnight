import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    // Optional: point at an already-installed Chromium instead of downloading one.
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Serves the production build on its own port so it never fights `pnpm dev`.
    command: `pnpm exec next start --port ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
  },
});
