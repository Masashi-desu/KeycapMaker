import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { classifyChangeSet } from "../scripts/change-classification.mjs";

const policy = JSON.parse(fs.readFileSync(new URL("../.github/change-policy.json", import.meta.url), "utf8"));

const packageJson = {
  name: "example",
  private: true,
  description: "before",
  scripts: { build: "vite build", test: "node --test" },
  dependencies: { three: "1.0.0" },
};

const lock = {
  lockfileVersion: 3,
  packages: {
    "": { dependencies: { three: "1.0.0" } },
    "node_modules/three": { version: "1.0.0", resolved: "https://example.invalid/three.tgz", integrity: "sha512-a" },
  },
};

function classify(files, overrides = {}) {
  return classifyChangeSet({
    files,
    policy,
    beforePackage: packageJson,
    afterPackage: packageJson,
    beforeLock: lock,
    afterLock: lock,
    ...overrides,
  });
}

test("repository documentation receives only the lightweight documentation gate", () => {
  assert.deepEqual(classify(["README.md", "CONTRIBUTING.md"]), {
    classification: "documentation",
    docs: true,
    test: false,
    build: false,
    reasons: [
      "CONTRIBUTING.md: repository documentation",
      "README.md: repository documentation",
    ],
  });
});

test("root license and contribution documents use the documentation gate", () => {
  assert.equal(classify(["LICENSE", "CONTRIBUTING.md"]).classification, "documentation");
});

test("a file copied into the published site remains an artifact even when it is a README", () => {
  assert.equal(classify(["public/README.md"]).classification, "artifact");
});

test("co-located source and SCAD responsibility documents remain documentation", () => {
  assert.equal(classify(["src/README.md", "scad/modules/README.md", ".github/workflows/README.md"]).classification, "documentation");
});

test("tests and workflows run tests without building", () => {
  const result = classify(["test/example.test.js", ".github/workflows/ci.yml"]);
  assert.equal(result.classification, "validation");
  assert.equal(result.test, true);
  assert.equal(result.build, false);
});

test("safe package metadata changes stop after classification", () => {
  const afterPackage = { ...packageJson, description: "after" };
  assert.equal(classify(["package.json"], { afterPackage }).classification, "metadata");
});

test("test-script-only package changes use the validation gate", () => {
  const afterPackage = { ...packageJson, scripts: { ...packageJson.scripts, "test:docs": "node docs.js" } };
  assert.equal(classify(["package.json"], { afterPackage }).classification, "validation");
});

test("build scripts and dependency declarations are artifact changes", () => {
  const buildScriptPackage = { ...packageJson, scripts: { ...packageJson.scripts, build: "vite build --emptyOutDir" } };
  const dependencyPackage = { ...packageJson, dependencies: { three: "2.0.0" } };
  assert.equal(classify(["package.json"], { afterPackage: buildScriptPackage }).classification, "artifact");
  assert.equal(classify(["package.json"], { afterPackage: dependencyPackage }).classification, "artifact");
});

test("lockfile root metadata is ignored but dependency graph changes build", () => {
  const metadataLock = structuredClone(lock);
  metadataLock.packages[""].version = "2.0.0";
  const graphLock = structuredClone(lock);
  graphLock.packages["node_modules/three"].version = "2.0.0";
  assert.equal(classify(["package-lock.json"], { afterLock: metadataLock }).classification, "metadata");
  assert.equal(classify(["package-lock.json"], { afterLock: graphLock }).classification, "artifact");
});

test("mixed changes use the strongest gate", () => {
  const result = classify(["README.md", "test/example.test.js", "src/main.js"]);
  assert.equal(result.classification, "artifact");
  assert.equal(result.test, true);
  assert.equal(result.build, true);
});

test("dedicated workflow resources do not trigger duplicate generic work", () => {
  const dedicatedPolicy = { ...policy, dedicatedWorkflowOwnership: ["special/**"] };
  assert.equal(classify(["special/catalog.json"], { policy: dedicatedPolicy }).classification, "dedicated");
});

test("manual execution requests tests and build", () => {
  const result = classify([], { manual: true });
  assert.equal(result.classification, "artifact");
  assert.equal(result.test, true);
  assert.equal(result.build, true);
});
