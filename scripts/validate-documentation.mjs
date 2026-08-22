#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(MODULE_DIR, "..");
const IGNORED_DIRECTORIES = new Set([".git", ".tmp", "dist", "node_modules"]);

function walkFiles(directory, predicate, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(file, predicate, output);
    } else if (predicate(file)) {
      output.push(file);
    }
  }
  return output;
}

function relative(repoRoot, file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
}

function markdownTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith("<")) {
    return trimmed.slice(1, trimmed.indexOf(">"));
  }
  return trimmed.split(/\s+["']/u, 1)[0];
}

function isExternalTarget(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|#)/iu.test(target);
}

function validateMarkdownLinks(repoRoot, markdownFiles, errors) {
  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\n]+)\)/gu)) {
      const target = markdownTarget(match[1]);
      if (!target || isExternalTarget(target)) {
        continue;
      }
      const withoutFragment = target.split("#", 1)[0].split("?", 1)[0];
      const decoded = decodeURIComponent(withoutFragment);
      const resolved = decoded.startsWith("/")
        ? path.join(repoRoot, decoded.slice(1))
        : path.resolve(path.dirname(file), decoded);
      if (!fs.existsSync(resolved)) {
        errors.push(`${relative(repoRoot, file)}: missing local Markdown target ${target}`);
      }
    }
  }
}

function validateDocumentedCommands(repoRoot, markdownFiles, errors) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  const scripts = packageJson.scripts ?? {};
  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/\bnpm\s+(?:run\s+([a-zA-Z0-9:_-]+)|(test))\b/gu)) {
      const script = match[1] ?? match[2];
      if (!(script in scripts)) {
        errors.push(`${relative(repoRoot, file)}: npm script is not defined: ${script}`);
      }
    }
    for (const match of text.matchAll(/\bnode\s+((?:\.{0,2}\/)?[^\s`"']+\.(?:cjs|js|mjs))\b/gu)) {
      const scriptPath = path.resolve(repoRoot, match[1]);
      if (!fs.existsSync(scriptPath)) {
        errors.push(`${relative(repoRoot, file)}: referenced Node script does not exist: ${match[1]}`);
      }
    }
  }
}

function findOverviewDocument(repoRoot) {
  const candidates = fs.readdirSync(repoRoot)
    .filter((name) => /^readme(?:\.[^.]+)?$/iu.test(name))
    .map((name) => path.join(repoRoot, name));
  if (candidates.length !== 1) {
    throw new Error(`expected one root overview document, found ${candidates.length}`);
  }
  return candidates[0];
}

function findThirdPartyDocument(overviewFile) {
  const text = fs.readFileSync(overviewFile, "utf8");
  for (const match of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/gu)) {
    if (/third[- ]party|第三者/iu.test(`${match[1]} ${match[2]}`)) {
      return path.resolve(path.dirname(overviewFile), markdownTarget(match[2]));
    }
  }
  throw new Error("overview document does not link to a third-party license document");
}

function parseLockfileInventory(thirdPartyText) {
  const section = thirdPartyText.match(/<!-- lockfile-inventory:start -->([\s\S]*?)<!-- lockfile-inventory:end -->/u)?.[1] ?? "";
  const inventory = new Map();
  for (const match of section.matchAll(/^\| \[`([^`]+)`\]\([^)]+\) \| `([^`]+)` \|/gmu)) {
    inventory.set(match[1], match[2]);
  }
  return inventory;
}

function validateThirdPartyInventory(repoRoot, overviewFile, errors) {
  let thirdPartyFile;
  try {
    thirdPartyFile = findThirdPartyDocument(overviewFile);
  } catch (error) {
    errors.push(error.message);
    return;
  }
  if (!fs.existsSync(thirdPartyFile)) {
    errors.push(`missing third-party license document: ${relative(repoRoot, thirdPartyFile)}`);
    return;
  }

  const thirdPartyText = fs.readFileSync(thirdPartyFile, "utf8");
  const inventory = parseLockfileInventory(thirdPartyText);
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, "package-lock.json"), "utf8"));
  for (const [packagePath, metadata] of Object.entries(lock.packages ?? {})) {
    if (!packagePath) {
      continue;
    }
    const name = packagePath.replace(/^node_modules\//u, "");
    if (inventory.get(name) !== metadata.version) {
      errors.push(`${relative(repoRoot, thirdPartyFile)}: lockfile entry missing or stale: ${name}@${metadata.version}`);
    }
  }

  const htmlFiles = walkFiles(repoRoot, (file) => file.endsWith(".html"));
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, "utf8");
    for (const hrefMatch of html.matchAll(/href=["']([^"']*fonts\.googleapis\.com[^"']+)["']/gu)) {
      const url = new URL(hrefMatch[1].replaceAll("&amp;", "&"));
      for (const family of url.searchParams.getAll("family")) {
        const familyName = family.split(":", 1)[0];
        if (!thirdPartyText.includes(`\`${familyName}\``)) {
          errors.push(`${relative(repoRoot, thirdPartyFile)}: active Google Fonts family is missing: ${familyName}`);
        }
      }
    }
  }

  const sourceFiles = walkFiles(path.join(repoRoot, "src"), (file) => /\.(?:js|mjs)$/u.test(file));
  const sourceText = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const jsDelivrPackages = new Map();
  for (const match of sourceText.matchAll(/cdn\.jsdelivr\.net\/npm\/((?:@[^/@]+\/)?[^/@]+)@([^/"']+)/gu)) {
    jsDelivrPackages.set(match[1], match[2]);
  }
  for (const [packageName, version] of jsDelivrPackages) {
    if (!thirdPartyText.includes(`\`${packageName}\``)) {
      errors.push(`${relative(repoRoot, thirdPartyFile)}: active jsDelivr package is missing: ${packageName}@${version}`);
    }
  }

  const fontRegistryCandidates = sourceFiles.filter((file) => /font/iu.test(path.basename(file)));
  for (const registryFile of fontRegistryCandidates) {
    const registryText = fs.readFileSync(registryFile, "utf8");
    for (const match of registryText.matchAll(/assetPath:\s*["']fonts\/([^"']+)["']/gu)) {
      if (!thirdPartyText.includes(`\`${match[1]}\``)) {
        errors.push(`${relative(repoRoot, thirdPartyFile)}: bundled font is missing: ${match[1]}`);
      }
    }
  }

  const vendorRoot = path.join(repoRoot, "public", "vendor");
  if (fs.existsSync(vendorRoot)) {
    for (const entry of fs.readdirSync(vendorRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
      const vendorPath = `public/vendor/${entry.name}`;
      if (!thirdPartyText.includes(`\`${vendorPath}/\``)) {
        errors.push(`${relative(repoRoot, thirdPartyFile)}: vendored component is missing: ${vendorPath}/`);
      }
    }
  }
}

function htmlAttribute(tag, name) {
  return tag.match(new RegExp(`${name}=["']([^"']+)["']`, "iu"))?.[1] ?? null;
}

function resolvePublicDirectory(repoRoot) {
  const config = fs.readdirSync(repoRoot).find((name) => /^vite\.config\.(?:js|mjs|ts)$/u.test(name));
  if (!config) {
    throw new Error("cannot resolve Vite configuration");
  }
  const configText = fs.readFileSync(path.join(repoRoot, config), "utf8");
  return configText.match(/publicDir:\s*["']([^"']+)["']/u)?.[1] ?? "public";
}

function validateOpenGraphImage(repoRoot, overviewFile, errors) {
  const htmlFile = fs.readdirSync(repoRoot)
    .map((name) => path.join(repoRoot, name))
    .find((file) => fs.statSync(file).isFile() && file.endsWith(".html") && fs.readFileSync(file, "utf8").includes("og:image"));
  if (!htmlFile) {
    errors.push("cannot find HTML metadata containing og:image");
    return;
  }

  const html = fs.readFileSync(htmlFile, "utf8");
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gu)].map((match) => match[0]);
  const ogTag = metaTags.find((tag) => htmlAttribute(tag, "property") === "og:image");
  const canonicalTag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/u)?.[0];
  const ogUrl = ogTag && htmlAttribute(ogTag, "content");
  const canonicalUrl = canonicalTag && htmlAttribute(canonicalTag, "href");
  if (!ogUrl || !canonicalUrl) {
    errors.push(`${relative(repoRoot, htmlFile)}: og:image or canonical URL is missing`);
    return;
  }

  const imageUrl = new URL(ogUrl, canonicalUrl);
  const canonical = new URL(canonicalUrl);
  const relativeImagePath = imageUrl.pathname.startsWith(canonical.pathname)
    ? imageUrl.pathname.slice(canonical.pathname.length)
    : path.posix.basename(imageUrl.pathname);
  const publicDir = resolvePublicDirectory(repoRoot);
  const imageFile = path.resolve(repoRoot, publicDir, relativeImagePath);
  if (!fs.existsSync(imageFile)) {
    errors.push(`${relative(repoRoot, htmlFile)}: og:image asset does not exist: ${relative(repoRoot, imageFile)}`);
    return;
  }

  const overviewText = fs.readFileSync(overviewFile, "utf8");
  const overviewImages = [...overviewText.matchAll(/!\[[^\]]*\]\(([^)]+)\)/gu)]
    .map((match) => path.resolve(path.dirname(overviewFile), markdownTarget(match[1]).split("#", 1)[0]));
  if (!overviewImages.some((file) => path.normalize(file) === path.normalize(imageFile))) {
    errors.push(`${relative(repoRoot, overviewFile)}: overview does not show the active og:image asset ${relative(repoRoot, imageFile)}`);
  }
}

export function validateRepositoryDocumentation(repoRoot = DEFAULT_REPO_ROOT) {
  const errors = [];
  const markdownFiles = walkFiles(repoRoot, (file) => file.endsWith(".md"));
  const overviewFile = findOverviewDocument(repoRoot);
  validateMarkdownLinks(repoRoot, markdownFiles, errors);
  validateDocumentedCommands(repoRoot, markdownFiles, errors);
  validateThirdPartyInventory(repoRoot, overviewFile, errors);
  validateOpenGraphImage(repoRoot, overviewFile, errors);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(process.argv[2] ?? DEFAULT_REPO_ROOT);
  const errors = validateRepositoryDocumentation(repoRoot);
  if (errors.length > 0) {
    console.error(`documentation validation failed:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
  console.log("documentation validation passed");
}
