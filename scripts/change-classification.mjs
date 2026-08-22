#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, "..");
const ZERO_SHA = /^0+$/;
const SAFE_PACKAGE_METADATA_FIELDS = new Set([
  "author",
  "bugs",
  "contributors",
  "description",
  "funding",
  "homepage",
  "keywords",
  "license",
  "name",
  "private",
  "repository",
  "version",
]);

const CLASS_RANK = {
  dedicated: 0,
  metadata: 1,
  documentation: 2,
  validation: 3,
  artifact: 4,
};

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function changedObjectKeys(before = {}, after = {}) {
  return [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
    .filter((key) => stableJson(before?.[key]) !== stableJson(after?.[key]));
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("**/", "\u0001")
    .replaceAll("**", "\u0000")
    .replaceAll("*", "[^/]*")
    .replaceAll("\u0001", "(?:.*/)?")
    .replaceAll("\u0000", ".*");
  return new RegExp(`^${escaped}$`);
}

function matchesAny(file, patterns = []) {
  return patterns.some((pattern) => globToRegExp(pattern).test(file));
}

function normalizeLockGraph(lock) {
  if (!lock) {
    return null;
  }

  const packages = {};
  for (const [packagePath, metadata] of Object.entries(lock.packages ?? {})) {
    if (packagePath === "") {
      packages[packagePath] = {
        dependencies: metadata.dependencies ?? {},
        devDependencies: metadata.devDependencies ?? {},
        optionalDependencies: metadata.optionalDependencies ?? {},
      };
      continue;
    }
    packages[packagePath] = {
      version: metadata.version,
      resolved: metadata.resolved,
      integrity: metadata.integrity,
      dependencies: metadata.dependencies ?? {},
      optionalDependencies: metadata.optionalDependencies ?? {},
      peerDependencies: metadata.peerDependencies ?? {},
      dev: Boolean(metadata.dev),
      optional: Boolean(metadata.optional),
      os: metadata.os ?? [],
      cpu: metadata.cpu ?? [],
    };
  }

  return {
    lockfileVersion: lock.lockfileVersion,
    packages,
  };
}

function packageChangeClass(beforePackage, afterPackage) {
  if (!beforePackage || !afterPackage) {
    return "artifact";
  }

  const changedKeys = changedObjectKeys(beforePackage, afterPackage);
  if (changedKeys.length === 0 || changedKeys.every((key) => SAFE_PACKAGE_METADATA_FIELDS.has(key))) {
    return "metadata";
  }

  const nonMetadataKeys = changedKeys.filter((key) => !SAFE_PACKAGE_METADATA_FIELDS.has(key));
  if (nonMetadataKeys.length === 1 && nonMetadataKeys[0] === "scripts") {
    const scriptKeys = changedObjectKeys(beforePackage.scripts, afterPackage.scripts);
    if (scriptKeys.every((key) => key === "test" || key.startsWith("test:") || key.startsWith("lint:"))) {
      return "validation";
    }
  }

  return "artifact";
}

export function classifyChangeSet({
  files,
  policy,
  beforePackage = null,
  afterPackage = null,
  beforeLock = null,
  afterLock = null,
  manual = false,
}) {
  if (manual) {
    return {
      classification: "artifact",
      docs: false,
      test: true,
      build: true,
      reasons: ["manual execution requests the complete release gate"],
    };
  }

  const normalizedFiles = [...new Set(files.map((file) => file.replaceAll("\\", "/")))].sort();
  const reasons = [];
  let classification = "dedicated";

  const raise = (nextClass, reason) => {
    if (CLASS_RANK[nextClass] > CLASS_RANK[classification]) {
      classification = nextClass;
    }
    reasons.push(reason);
  };

  for (const file of normalizedFiles) {
    if (file === "package.json") {
      const packageClass = packageChangeClass(beforePackage, afterPackage);
      raise(packageClass, `${file}: ${packageClass}`);
      continue;
    }

    if (file === "package-lock.json") {
      const graphChanged = stableJson(normalizeLockGraph(beforeLock)) !== stableJson(normalizeLockGraph(afterLock));
      raise(graphChanged ? "artifact" : "metadata", `${file}: ${graphChanged ? "dependency graph changed" : "metadata only"}`);
      continue;
    }

    if (matchesAny(file, policy.dedicatedWorkflowOwnership)) {
      reasons.push(`${file}: owned by a dedicated workflow`);
      continue;
    }
    if (matchesAny(file, policy.documentation)) {
      raise("documentation", `${file}: repository documentation`);
      continue;
    }
    if (matchesAny(file, policy.published)) {
      raise("artifact", `${file}: published source or asset`);
      continue;
    }
    if (matchesAny(file, policy.validation)) {
      raise("validation", `${file}: test, validation, automation, or workflow`);
      continue;
    }
    raise("artifact", `${file}: unclassified files use the safe artifact gate`);
  }

  if (normalizedFiles.length === 0) {
    classification = "metadata";
    reasons.push("no changed files");
  }

  return {
    classification,
    docs: classification === "documentation",
    test: classification === "validation" || classification === "artifact",
    build: classification === "artifact",
    reasons,
  };
}

function parseJson(text) {
  return text == null ? null : JSON.parse(text);
}

function git(repoRoot, args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (allowFailure) {
      return null;
    }
    throw error;
  }
}

function readAtRevision(repoRoot, revision, file) {
  if (!revision || ZERO_SHA.test(revision)) {
    return null;
  }
  return git(repoRoot, ["show", `${revision}:${file}`], { allowFailure: true });
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--manual") {
      args.manual = true;
    } else if (value.startsWith("--")) {
      args[value.slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  return args;
}

function appendGithubOutputs(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }
  const output = [
    `classification=${result.classification}`,
    `docs=${result.docs}`,
    `test=${result.test}`,
    `build=${result.build}`,
  ].join("\n");
  fs.appendFileSync(outputPath, `${output}\n`);
}

export function classifyGitRange({ repoRoot = DEFAULT_REPO_ROOT, base, head = "HEAD", manual = false }) {
  const policy = JSON.parse(fs.readFileSync(path.join(repoRoot, ".github/change-policy.json"), "utf8"));
  let files;
  if (manual) {
    files = [];
  } else if (!base || ZERO_SHA.test(base)) {
    files = git(repoRoot, ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", head]).split("\n").filter(Boolean);
  } else if (git(repoRoot, ["cat-file", "-e", `${base}^{commit}`], { allowFailure: true }) === null) {
    return {
      classification: "artifact",
      docs: false,
      test: true,
      build: true,
      reasons: [`base revision ${base} is unavailable; use the safe artifact gate`],
    };
  } else {
    files = git(repoRoot, ["diff", "--name-only", base, head]).split("\n").filter(Boolean);
  }

  return classifyChangeSet({
    files,
    policy,
    beforePackage: parseJson(readAtRevision(repoRoot, base, "package.json")),
    afterPackage: parseJson(readAtRevision(repoRoot, head, "package.json")),
    beforeLock: parseJson(readAtRevision(repoRoot, base, "package-lock.json")),
    afterLock: parseJson(readAtRevision(repoRoot, head, "package-lock.json")),
    manual,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const result = classifyGitRange({
    repoRoot: path.resolve(args.repo ?? DEFAULT_REPO_ROOT),
    base: args.base,
    head: args.head ?? "HEAD",
    manual: Boolean(args.manual),
  });
  appendGithubOutputs(result);
  console.log(JSON.stringify(result, null, 2));
}
