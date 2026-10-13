import { DownloadConsent } from "../pages/download-consent.js";

// Capture only registration. Tool execution still uses the real app commands.
// This is a mock producer API, not a native WebMCP compatibility test.
export async function installWebMcpRegistration(page) {
  await page.addInitScript(() => {
    const tools = new Map();
    globalThis.__keycapTestTools = tools;
    Object.defineProperty(document, "modelContext", {
      value: {
        registerTool(tool, { signal }) {
          tools.set(tool.name, tool);
          signal.addEventListener("abort", () => tools.delete(tool.name), { once: true });
        },
      },
      configurable: true,
    });
  });
}

export class WebMcpClient {
  constructor(page) {
    this.page = page;
  }

  async execute(name, input = {}) {
    await this.page.waitForFunction((toolName) => globalThis.__keycapTestTools?.has(toolName), `keycap_${name}`);
    return this.page.evaluate(({ name, input }) => globalThis.__keycapTestTools.get(`keycap_${name}`).execute(input), { name, input });
  }

  async executeWithDownload(name, input = {}) {
    const pendingDownload = this.page.waitForEvent("download");
    const pendingResult = this.execute(name, input);
    await new DownloadConsent(this.page).accept();
    const result = await pendingResult;
    return { result, download: await pendingDownload };
  }

  async startAbortableExport(format) {
    await this.page.waitForFunction(() => globalThis.__keycapTestTools?.has('keycap_export'));
    await this.page.evaluate((format) => {
      globalThis.__keycapTestExportController = new AbortController();
      globalThis.__keycapTestExportResult = null;
      globalThis.__keycapTestTools.get('keycap_export').execute({ format }, { signal: globalThis.__keycapTestExportController.signal })
        .then((result) => { globalThis.__keycapTestExportResult = result; },
          (error) => { globalThis.__keycapTestExportResult = { aborted: true, name: error.name }; });
    }, format);
  }

  async abortExport() {
    await this.page.evaluate(() => globalThis.__keycapTestExportController.abort());
    await this.page.waitForFunction(() => globalThis.__keycapTestExportResult !== null);
    return this.page.evaluate(() => globalThis.__keycapTestExportResult);
  }
}
