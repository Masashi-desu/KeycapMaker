import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = Number(process.env.KEYCAP_BROWSER_TEST_PORT ?? 4175);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("KEYCAP_BROWSER_TEST_PORT must be an integer from 1 to 65535.");
const baseURL = `http://127.0.0.1:${port}`;

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
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    url: baseURL,
    reuseExistingServer: false,
  },
});
