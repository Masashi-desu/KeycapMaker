import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));

// Each test gets fresh module caches and restores even globals that were absent.
export async function createScadTestContext(t, metricOverrides = {}) {
  const textMetrics = {
    width: 120,
    actualBoundingBoxLeft: 60,
    actualBoundingBoxRight: 60,
    actualBoundingBoxAscent: 50,
    actualBoundingBoxDescent: 30,
    ...metricOverrides,
  };
  const globals = {
    document: {
      createElement: (tagName) => tagName === "canvas"
        ? { getContext: () => ({ font: "", measureText: () => textMetrics }) }
        : {},
      fonts: { add() {} },
    },
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
    FontFace: class { async load() { return this; } },
    window: { location: { origin: "http://localhost" } },
  };
  const previous = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let server;
  t.after(async () => {
    try {
      await server?.close();
    } finally {
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  server = await createServer({
    root: PROJECT_ROOT,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  const [bundle, registry] = await Promise.all([
    server.ssrLoadModule("/src/lib/keycap-scad-bundle.js"),
    server.ssrLoadModule("/src/data/keycap-shape-registry.js"),
  ]);
  return { bundle, registry };
}
