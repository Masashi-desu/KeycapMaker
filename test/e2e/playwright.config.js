import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const baseURL = "http://127.0.0.1:4175";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.js",
  outputDir: "../../.tmp/playwright-results",
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: true,
    baseURL,
    viewport: { width: 1440, height: 1000 },
    locale: "ja-JP",
    actionTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4175 --strictPort",
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    url: baseURL,
    reuseExistingServer: false,
  },
});
