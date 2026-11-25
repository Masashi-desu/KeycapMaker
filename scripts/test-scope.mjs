import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import scopes from "../test/regression-scopes.json" with { type: "json" };

const root = fileURLToPath(new URL("../", import.meta.url));
const [scope] = process.argv.slice(2);

function runTests(layer, args) {
  console.log(`\n[${scope}] ${layer}`);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) console.error(result.error);
  if (result.status !== 0) process.exitCode = 1;
  return `[${scope}] ${layer}: ${result.status === 0 ? "PASS" : "FAIL"}`;
}

if (scope === "--matrix" && process.argv.length === 3) {
  const include = Object.entries(scopes).map(([scope, tests]) => ({ scope, browser: tests.browser.length > 0 }));
  console.log(JSON.stringify({ include }));
} else if (process.argv.length !== 3 || !Object.hasOwn(scopes, scope)) {
  console.error(`Usage: npm run test:scope -- <${Object.keys(scopes).join("|")}>`);
  process.exitCode = 1;
} else {
  const { node, browser } = scopes[scope];
  const results = [];
  if (node.length) {
    const files = node.map(file => `test/${file}`);
    results.push(runTests("Node", ["--test", ...files]));
  }
  if (browser.length) {
    const cli = fileURLToPath(import.meta.resolve("@playwright/test/cli"));
    results.push(runTests("Playwright", [cli, "test", "--config", "test/e2e/playwright.config.js", `--project=${scope}`]));
  }
  console.log(results.join("\n"));
}
