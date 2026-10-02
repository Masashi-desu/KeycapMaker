import { readFile } from "node:fs/promises";
import { test as base, expect } from "@playwright/test";
import { EditorPage } from "./pages/editor-page.js";
import { installWebMcpRegistration, WebMcpClient } from "./support/webmcp-client.js";

export const test = base.extend({
  editor: async ({ page }, use) => {
    // UI tests remain independent of public CDN availability. Bundled assets,
    // including the real OpenSCAD worker/WASM, are served by the local app.
    await page.route("**/*", (route) => new URL(route.request().url()).origin === "http://127.0.0.1:4175"
      ? route.continue() : route.abort());
    await use(new EditorPage(page));
  },
  webMcp: async ({ page }, use) => {
    await installWebMcpRegistration(page);
    await use(new WebMcpClient(page));
  },
});

export { expect };

export async function readDownloadedJson(download) {
  return JSON.parse(await readFile(await download.path(), "utf8"));
}
