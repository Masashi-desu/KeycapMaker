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
    const result = await this.execute(name, input);
    return { result, download: await pendingDownload };
  }
}
