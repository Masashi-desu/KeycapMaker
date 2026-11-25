import assert from "node:assert/strict";
import { globSync } from "node:fs";
import test from "node:test";
import scopes from "./regression-scopes.json" with { type: "json" };

test("each regression scope has tests to run", () => {
  for (const [name, { node, browser }] of Object.entries(scopes)) {
    assert.ok(node.length + browser.length > 0, name);
  }
});

for (const [layer, pattern, directory] of [
  ["node", "**/*.test.js", new URL("./", import.meta.url)],
  ["browser", "**/*.spec.js", new URL("./e2e/", import.meta.url)],
]) {
  test(`every ${layer} regression file belongs to exactly one scope`, () => {
    const registered = Object.values(scopes).flatMap(scope => scope[layer]);
    const files = globSync(pattern, { cwd: directory }).map(path => path.replaceAll("\\", "/"));
    assert.deepEqual(registered.sort(), files.sort());
  });
}
