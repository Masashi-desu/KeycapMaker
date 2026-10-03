import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { test as base, expect } from "@playwright/test";
import { EditorPage } from "./pages/editor-page.js";
import { installWebMcpRegistration, WebMcpClient } from "./support/webmcp-client.js";

export const test = base.extend({
  editor: async ({ page, baseURL }, use) => {
    // UI tests remain independent of public CDN availability. Bundled assets,
    // including the real OpenSCAD worker/WASM, are served by the local app.
    const appOrigin = new URL(baseURL).origin;
    await page.route("**/*", (route) => new URL(route.request().url()).origin === appOrigin
      ? route.continue() : route.abort());
    await use(new EditorPage(page));
  },
  webMcp: async ({ page }, use) => {
    await installWebMcpRegistration(page);
    await use(new WebMcpClient(page));
  },
  // Resolve editor first so its origin route cannot override this fault injection.
  scadUnavailable: async ({ editor, page }, use) => {
    await page.route("**/vendor/openscad/**", (route) => route.abort());
    await use(true);
  },
});

export { expect };

export async function readDownloadedJson(download) {
  return JSON.parse(await readFile(await download.path(), "utf8"));
}

export async function readDownloaded3mf(download) {
  return Object.fromEntries(Object.entries(unzipSync(new Uint8Array(await readFile(await download.path()))))
    .map(([path, bytes]) => [path, strFromU8(bytes)]));
}
