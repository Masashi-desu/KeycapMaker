import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { validateRepositoryDocumentation } from "../scripts/validate-documentation.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("repository documentation stays aligned with local files, scripts, dependencies, fonts, and metadata", () => {
  assert.deepEqual(validateRepositoryDocumentation(repoRoot), []);
});

test("bundled font files, registry entries, source notes, and license evidence stay aligned", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, ".codex/skills/keycap-font-addition/scripts/validate-font-assets.mjs"), repoRoot],
    { cwd: repoRoot, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
