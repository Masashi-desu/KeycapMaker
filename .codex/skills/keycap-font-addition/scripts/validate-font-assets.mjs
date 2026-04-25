#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
const fontDir = path.join(repoRoot, "public/fonts");
const registryPath = path.join(repoRoot, "src/lib/keycap-fonts.js");

const errors = [];
const warnings = [];

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function exists(file) {
  return fs.existsSync(file);
}

function stripFontSuffix(filename) {
  return filename.replace(/-(Regular|Variable)\.ttf$/, "");
}

function u16(buffer, offset) {
  return buffer.readUInt16BE(offset);
}

function u32(buffer, offset) {
  return buffer.readUInt32BE(offset);
}

function decodeUtf16be(bytes) {
  const chars = [];
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    chars.push(String.fromCharCode((bytes[index] << 8) | bytes[index + 1]));
  }
  return chars.join("").replace(/\0/g, "");
}

function decodeMacRoman(bytes) {
  return Buffer.from(bytes).toString("latin1").replace(/\0/g, "");
}

function readNameTable(file) {
  const buffer = fs.readFileSync(file);
  const numTables = u16(buffer, 4);
  let nameOffset = null;

  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    const tag = buffer.toString("ascii", recordOffset, recordOffset + 4);
    if (tag === "name") {
      nameOffset = u32(buffer, recordOffset + 8);
      break;
    }
  }

  if (nameOffset === null) {
    throw new Error(`${path.basename(file)} has no name table`);
  }

  const count = u16(buffer, nameOffset + 2);
  const stringBase = nameOffset + u16(buffer, nameOffset + 4);
  const names = new Map();

  for (let index = 0; index < count; index += 1) {
    const recordOffset = nameOffset + 6 + index * 12;
    const platformID = u16(buffer, recordOffset);
    const nameID = u16(buffer, recordOffset + 6);
    const length = u16(buffer, recordOffset + 8);
    const offset = u16(buffer, recordOffset + 10);

    if (![0, 1, 4, 5, 13, 14].includes(nameID) || names.has(nameID)) {
      continue;
    }

    const bytes = buffer.subarray(stringBase + offset, stringBase + offset + length);
    const decoded = platformID === 0 || platformID === 3 ? decodeUtf16be(bytes) : decodeMacRoman(bytes);
    names.set(nameID, decoded.replace(/\s+/g, " ").trim());
  }

  return names;
}

function parseBundledShaLines(note) {
  const lines = new Map();
  for (const match of note.matchAll(/^- ([^:\n]+): ([a-f0-9]{64})$/gim)) {
    lines.set(match[1].trim(), match[2].toLowerCase());
  }
  return lines;
}

function isOflLabel(label) {
  return /open font license|ofl/i.test(label ?? "");
}

if (!exists(fontDir)) {
  errors.push(`missing font directory: ${fontDir}`);
}

if (!exists(registryPath)) {
  errors.push(`missing font registry: ${registryPath}`);
}

let registry = [];
if (errors.length === 0) {
  const registryModule = await import(`${pathToFileURL(registryPath).href}?validate=${Date.now()}`);
  registry = registryModule.KEYCAP_LEGEND_FONTS ?? [];
}

const files = exists(fontDir) ? fs.readdirSync(fontDir).sort() : [];
const ttfFiles = files.filter((file) => file.endsWith(".ttf"));
const registeredAssets = new Set(registry.map((font) => path.basename(font.assetPath ?? "")));
const ttfSet = new Set(ttfFiles);

for (const font of registry) {
  const asset = path.basename(font.assetPath ?? "");
  const base = stripFontSuffix(asset);
  const assetFile = path.join(fontDir, asset);
  const sourceFile = [path.join(fontDir, `${base}-SOURCE.txt`), path.join(fontDir, `${base}-MODI.txt`)].find(exists);

  if (!asset || !font.assetPath) {
    errors.push(`${font.key}: missing assetPath`);
    continue;
  }

  if (!exists(assetFile)) {
    errors.push(`${font.key}: missing asset ${asset}`);
    continue;
  }

  if (!font.licenseLabel) {
    errors.push(`${font.key}: missing licenseLabel`);
  }

  if (!sourceFile) {
    errors.push(`${font.key}: missing ${base}-SOURCE.txt or ${base}-MODI.txt`);
    continue;
  }

  const note = readText(sourceFile);
  const requiredHeadings = ["Review date:", "Bundled files", "Bundled SHA-256", "License evidence", "Font metadata", "Use note"];
  for (const heading of requiredHeadings) {
    if (!note.includes(heading)) {
      errors.push(`${path.basename(sourceFile)}: missing "${heading}"`);
    }
  }

  if (!/Review date:\n\d{4}-\d{2}-\d{2}/.test(note)) {
    errors.push(`${path.basename(sourceFile)}: Review date must use YYYY-MM-DD`);
  }

  if (/raw\.githubusercontent\.com\/[^/\s]+\/[^/\s]+\/(main|master)\//.test(note)) {
    errors.push(`${path.basename(sourceFile)}: bundled raw GitHub URLs must be commit/tag fixed, not main/master`);
  }

  const shaLines = parseBundledShaLines(note);
  if (shaLines.get(asset) !== sha256(assetFile)) {
    errors.push(`${path.basename(sourceFile)}: SHA-256 mismatch or missing for ${asset}`);
  }

  for (const [bundledFile, expectedHash] of shaLines.entries()) {
    const file = path.join(fontDir, bundledFile);
    if (!exists(file)) {
      errors.push(`${path.basename(sourceFile)}: listed bundled file does not exist: ${bundledFile}`);
      continue;
    }
    const actualHash = sha256(file);
    if (actualHash !== expectedHash) {
      errors.push(`${path.basename(sourceFile)}: SHA-256 mismatch for ${bundledFile}`);
    }
  }

  let nameTable;
  try {
    nameTable = readNameTable(assetFile);
  } catch (error) {
    errors.push(`${asset}: ${error.message}`);
    continue;
  }

  const licenseDescription = nameTable.get(13) ?? "";
  if (isOflLabel(font.licenseLabel)) {
    const licenseFile = path.join(fontDir, `${base}-OFL.txt`);
    if (!exists(licenseFile)) {
      errors.push(`${font.key}: missing ${base}-OFL.txt`);
    } else {
      const licenseText = readText(licenseFile);
      if (!/SIL OPEN FONT LICENSE Version 1\.1|SIL Open Font License, Version 1\.1/i.test(licenseText)) {
        errors.push(`${base}-OFL.txt: does not look like SIL OFL 1.1 text`);
      }
      if (shaLines.has(path.basename(licenseFile)) && shaLines.get(path.basename(licenseFile)) !== sha256(licenseFile)) {
        errors.push(`${path.basename(sourceFile)}: SHA-256 mismatch for ${path.basename(licenseFile)}`);
      }
    }

    if (!/SIL Open Font License,? Version 1\.1/i.test(licenseDescription)) {
      warnings.push(`${asset}: nameID 13 does not explicitly mention SIL OFL 1.1; confirm source note evidence is sufficient`);
    }
  } else {
    const hasAttributionLines = Array.isArray(font.requiredAttributionLines) && font.requiredAttributionLines.length > 0;
    const hasNoAttributionStatement = /Visible attribution:\s*not required by reviewed terms/i.test(note);
    if (!hasAttributionLines && !hasNoAttributionStatement) {
      errors.push(`${font.key}: non-OFL font must provide requiredAttributionLines or note that visible attribution is not required`);
    }
    if (!licenseDescription) {
      warnings.push(`${asset}: nameID 13 license description is empty; source note must carry official evidence`);
    }
  }
}

for (const ttf of ttfFiles) {
  if (!registeredAssets.has(ttf)) {
    errors.push(`unregistered bundled TTF: ${ttf}`);
  }
  const base = stripFontSuffix(ttf);
  if (!exists(path.join(fontDir, `${base}-SOURCE.txt`)) && !exists(path.join(fontDir, `${base}-MODI.txt`))) {
    errors.push(`${ttf}: missing source or terms note`);
  }
}

for (const asset of registeredAssets) {
  if (!ttfSet.has(asset)) {
    errors.push(`registered asset missing from public/fonts: ${asset}`);
  }
}

const unexpectedFiles = files.filter((file) => !file.endsWith(".ttf") && !file.endsWith(".txt") && file !== "README.md");
if (unexpectedFiles.length > 0) {
  warnings.push(`unexpected files in public/fonts: ${unexpectedFiles.join(", ")}`);
}

console.log(`registered fonts: ${registry.length}`);
console.log(`bundled TTFs: ${ttfFiles.length}`);
console.log(`font note/license text files: ${files.filter((file) => file.endsWith(".txt")).length}`);

if (warnings.length > 0) {
  console.log(`warnings:\n- ${warnings.join("\n- ")}`);
}

if (errors.length > 0) {
  console.error(`errors:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log("font asset validation passed");
