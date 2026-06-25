import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as fontAwesomeIcons from "@fortawesome/free-solid-svg-icons";

import {
  KEYCAP_RECOMMENDED_LEGEND_ICON_NAMES,
  buildLegendIconSvg,
  getLegendIconRuntimePath,
  isLegendIconFillAvailable,
  inferLegendIconFillFromName,
  isLegendIconFillSupported,
  listLegendIconSets,
  listAvailableLegendIcons,
  listRecommendedLegendIcons,
  resolveLegendIcon,
  resolveLegendIconFill,
  resolveLegendIconName,
  searchLegendIcons,
} from "../src/lib/keycap-icons.js";
import fontAwesomeSolidIconSet from "../src/data/icon-sets/font-awesome-solid-icons.js";
import materialSymbolsIconSet from "../src/data/icon-sets/material-symbols-base.js";
import remixIconPathSet from "../src/data/icon-sets/remix-icon-paths.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function collectFiles(dir, predicate) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath, predicate));
    } else if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

function extractSvgPathData(svg) {
  return [...svg.matchAll(/<path\b[^>]*\sd=(["'])(.*?)\1[^>]*>/g)].map((match) => match[2]);
}

test("アイコン picker の初期一覧はキーキャップ向け候補を表示する", () => {
  const recommendedIcons = listRecommendedLegendIcons();

  assert.equal(recommendedIcons[0]?.name, "arrow-up");
  assert.equal(recommendedIcons[1]?.name, "arrow-down");
  assert.equal(recommendedIcons.at(-1)?.name, "ampersand");
  assert.equal(recommendedIcons.length, KEYCAP_RECOMMENDED_LEGEND_ICON_NAMES.length);
  assert.equal(new Set(recommendedIcons.map((icon) => icon.name)).size, recommendedIcons.length);
});

test("検索時は初期候補にない Lucide アイコンも選択候補へ出す", () => {
  const defaultResults = searchLegendIcons("", "lucide", 96).map((icon) => icon.name);
  const searchResults = searchLegendIcons("file-volume", "lucide", 96).map((icon) => icon.name);

  assert.equal(defaultResults.includes("file-volume"), false);
  assert.ok(searchResults.includes("file-volume"));
});

test("Lucide アイコンは全件モデル用 SVG body を持つ", () => {
  const lucideIcons = listAvailableLegendIcons("lucide");

  assert.equal(lucideIcons.length, 1737);
  assert.equal(lucideIcons.filter((icon) => !icon.body).length, 0);
});

test("各アイコンセットは共通の body 形式でモデル用 SVG を生成する", () => {
  listLegendIconSets().forEach((iconSet) => {
    const icons = listAvailableLegendIcons(iconSet.key);
    assert.ok(icons.length > 0, `${iconSet.key} should have icons`);
    assert.equal(icons.filter((icon) => !icon.body).length, 0, `${iconSet.key} should have SVG bodies`);
    assert.equal(icons.filter((icon) => "paths" in icon || "svgPathData" in icon).length, 0, `${iconSet.key} should not expose set-specific path fields`);
  });
});

test("Material Symbols のモデル用 body は元 Iconify data の Outlined FILL=0 形状を使う", async () => {
  const original = JSON.parse(await readFile(
    path.join(PROJECT_ROOT, "node_modules/@iconify-json/material-symbols/icons.json"),
    "utf8",
  ));
  const mismatches = [];

  Object.entries(materialSymbolsIconSet.icons ?? {}).forEach(([name, definition]) => {
    const originalDefinition = original.icons?.[name];
    if (!originalDefinition) {
      mismatches.push(`${name}: missing`);
      return;
    }

    const shapeDefinition = original.icons?.[`${name}-outline`] ?? originalDefinition;
    const generatedWidth = definition.width ?? materialSymbolsIconSet.width;
    const generatedHeight = definition.height ?? materialSymbolsIconSet.height;
    const originalWidth = shapeDefinition.width ?? original.width;
    const originalHeight = shapeDefinition.height ?? original.height;
    if (
      definition.body !== shapeDefinition.body
      || generatedWidth !== originalWidth
      || generatedHeight !== originalHeight
    ) {
      mismatches.push(`${name}: mismatch`);
    }
  });

  assert.equal(materialSymbolsIconSet.icons.circle.body, original.icons["circle-outline"].body);
  assert.equal(materialSymbolsIconSet.icons.circle.filledBody, original.icons.circle.body);
  assert.deepEqual(mismatches, []);
});

test("対応アイコンセットは共通の fill bool から provider 別の実体名と SVG 形状を解決する", () => {
  assert.equal(isLegendIconFillSupported("lucide"), false);
  assert.equal(isLegendIconFillSupported("font-awesome"), false);
  assert.equal(isLegendIconFillSupported("material-symbols"), true);
  assert.equal(isLegendIconFillSupported("remix-icon"), true);
  assert.equal(isLegendIconFillAvailable("circle", "material-symbols"), true);
  assert.equal(isLegendIconFillAvailable("arrow-forward", "material-symbols"), false);
  assert.equal(isLegendIconFillAvailable("circle-line", "remix-icon"), true);
  assert.equal(resolveLegendIconFill("1"), true);
  assert.equal(resolveLegendIconFill("false"), false);

  const materialCircle = resolveLegendIcon("circle", "material-symbols");
  const materialOutlineSvg = buildLegendIconSvg(materialCircle);
  const materialFilledSvg = buildLegendIconSvg(materialCircle, { filled: true });

  assert.notDeepEqual(extractSvgPathData(materialOutlineSvg), extractSvgPathData(materialFilledSvg));
  assert.equal(materialOutlineSvg.includes("fill-rule=\"nonzero\""), true);
  assert.equal(materialFilledSvg.includes("fill-rule=\"nonzero\""), true);
  assert.equal(getLegendIconRuntimePath("circle", "material-symbols"), "/icons/material-symbols/circle.svg");
  assert.equal(getLegendIconRuntimePath("circle", "material-symbols", { filled: true }), "/icons/material-symbols/circle-fill.svg");
  assert.equal(resolveLegendIconName("circle-outline", "material-symbols"), "circle");
  assert.equal(resolveLegendIconName("circle-fill", "material-symbols"), "circle");
  assert.equal(inferLegendIconFillFromName("circle-outline", "material-symbols"), false);
  assert.equal(inferLegendIconFillFromName("circle-fill", "material-symbols"), true);

  const materialArrow = resolveLegendIcon("arrow-forward", "material-symbols");
  const materialArrowSvg = buildLegendIconSvg(materialArrow);
  assert.equal(buildLegendIconSvg(materialArrow, { filled: true }), materialArrowSvg);
  assert.equal(getLegendIconRuntimePath("arrow-forward", "material-symbols", { filled: true }), "/icons/material-symbols/arrow-forward.svg");

  const remixCircle = resolveLegendIcon("circle-line", "remix-icon");
  const remixOutlineSvg = buildLegendIconSvg(remixCircle);
  const remixFilledSvg = buildLegendIconSvg(remixCircle, { filled: true });

  assert.notDeepEqual(extractSvgPathData(remixOutlineSvg), extractSvgPathData(remixFilledSvg));
  assert.equal(remixOutlineSvg.includes("fill-rule=\"nonzero\""), true);
  assert.equal(remixFilledSvg.includes("fill-rule=\"nonzero\""), true);
  assert.equal(listAvailableLegendIcons("remix-icon").some((icon) => icon.name === "circle-fill"), false);
  assert.equal(resolveLegendIconName("circle-fill", "remix-icon"), "circle-line");
  assert.equal(inferLegendIconFillFromName("circle-fill", "remix-icon"), true);
  assert.equal(getLegendIconRuntimePath("circle-line", "remix-icon"), "/icons/remix-icon/circle-line.svg");
  assert.equal(getLegendIconRuntimePath("circle-line", "remix-icon", { filled: true }), "/icons/remix-icon/circle-fill.svg");
});

test("モデル用 SVG は compound path の塗り規則を nonzero として明示する", () => {
  const materialPowerSvg = buildLegendIconSvg(resolveLegendIcon("power", "material-symbols"));
  const materialPowerParent = materialSymbolsIconSet.icons["power-plug"];
  const materialPowerPath = extractSvgPathData(materialPowerSvg)[0];
  const materialPowerRawPath = extractSvgPathData(materialPowerParent.body)[0];

  assert.equal(resolveLegendIconName("power", "material-symbols"), "power");
  assert.notEqual(materialPowerPath, materialPowerRawPath);
  assert.match(materialPowerPath, /v-4h2v4h4v-4h2v4c/);
  assert.doesNotMatch(materialPowerPath, /L8[,\s]+8/);
  assert.match(materialPowerSvg, /<svg[^>]+fill-rule="nonzero"[^>]+clip-rule="nonzero"/);
  assert.match(materialPowerSvg, /<path[^>]+fill-rule="nonzero"[^>]+clip-rule="nonzero"/);
  assert.equal(materialPowerParent.body.includes("fill-rule"), false);
});

test("全アイコンセットのモデル用 SVG は通常形状と塗りつぶし形状を生成できる", () => {
  let generatedCount = 0;

  listLegendIconSets().forEach((iconSet) => {
    listAvailableLegendIcons(iconSet.key).forEach((icon) => {
      assert.match(buildLegendIconSvg(icon), /^<svg\b/);
      generatedCount += 1;
      if (isLegendIconFillAvailable(icon.name, iconSet.key)) {
        assert.match(buildLegendIconSvg(icon, { filled: true }), /^<svg\b/);
        generatedCount += 1;
      }
    });
  });

  assert.ok(generatedCount > 10000);
});

test("Font Awesome のモデル用 path は元 package 定義から変えない", () => {
  const originalByName = new Map();
  Object.values(fontAwesomeIcons).forEach((value) => {
    if (
      value
      && typeof value === "object"
      && value.prefix === "fas"
      && typeof value.iconName === "string"
      && Array.isArray(value.icon)
      && !originalByName.has(value.iconName)
    ) {
      originalByName.set(value.iconName, value.icon);
    }
  });

  const mismatches = [];
  Object.entries(fontAwesomeSolidIconSet).forEach(([name, definition]) => {
    const original = originalByName.get(name);
    if (!original) {
      mismatches.push(`${name}: missing`);
      return;
    }
    const [width, height, , unicode, svgPathData] = original;
    if (
      definition.width !== width
      || definition.height !== height
      || definition.unicode !== unicode
      || JSON.stringify(definition.svgPathData) !== JSON.stringify(svgPathData)
    ) {
      mismatches.push(`${name}: mismatch`);
    }
  });

  assert.equal(Object.keys(fontAwesomeSolidIconSet).length, originalByName.size);
  assert.deepEqual(mismatches, []);
});

test("Remix Icon のモデル用 path は元 SVG の path d をそのまま使う", async () => {
  const svgFiles = await collectFiles(
    path.join(PROJECT_ROOT, "node_modules/remixicon/icons"),
    (entryPath) => entryPath.endsWith(".svg"),
  );
  const originalByName = new Map();

  await Promise.all(svgFiles.map(async (entryPath) => {
    const svg = await readFile(entryPath, "utf8");
    originalByName.set(path.basename(entryPath, ".svg"), extractSvgPathData(svg));
  }));

  const mismatches = [];
  Object.entries(remixIconPathSet).forEach(([name, paths]) => {
    const original = originalByName.get(name);
    if (!original) {
      mismatches.push(`${name}: missing`);
      return;
    }
    if (JSON.stringify(paths) !== JSON.stringify(original)) {
      mismatches.push(`${name}: mismatch`);
    }
  });

  assert.equal(Object.keys(remixIconPathSet).length, originalByName.size);
  assert.deepEqual(mismatches, []);
});

test("複数アイコンセットを共通 API で検索できる", () => {
  const iconSetKeys = listLegendIconSets().map((iconSet) => iconSet.key);

  assert.deepEqual(iconSetKeys, ["lucide", "material-symbols", "font-awesome", "remix-icon"]);
  assert.ok(listLegendIconSets().every((iconSet) => iconSet.faviconUrl));
  assert.ok(listAvailableLegendIcons("material-symbols").length > 4000);
  assert.ok(searchLegendIcons("keyboard_command_key", "material-symbols", 8).some((icon) => icon.name === "keyboard-command-key"));
  assert.ok(searchLegendIcons("volume-up", "font-awesome", 8).some((icon) => icon.name === "volume-high"));
  assert.ok(searchLegendIcons("command", "remix-icon", 8).some((icon) => icon.name === "command-line"));
});

test("アイコン名の正規化と SVG 生成はアイコンセットごとの既定値を使う", () => {
  assert.equal(resolveLegendIconName("keyboard_command_key", "material-symbols"), "keyboard-command-key");
  assert.equal(resolveLegendIconName("volume-up", "font-awesome"), "volume-high");
  assert.equal(resolveLegendIconName("circle", "remix-icon"), "circle-line");

  const fontAwesomeSvg = buildLegendIconSvg(searchLegendIcons("volume-up", "font-awesome", 1)[0]);
  const remixSvg = buildLegendIconSvg(searchLegendIcons("command", "remix-icon", 1)[0]);
  const lucideCircleSvg = buildLegendIconSvg(searchLegendIcons("circle", "lucide", 1)[0]);
  const lucideStrokeSvg = buildLegendIconSvg(searchLegendIcons("circle-power", "lucide", 1)[0]);
  const lucideDeleteSvg = buildLegendIconSvg(searchLegendIcons("delete", "lucide", 1)[0]);
  const lucideCommandSvg = buildLegendIconSvg(searchLegendIcons("command", "lucide", 1)[0]);

  assert.match(fontAwesomeSvg, /width="24mm"/);
  assert.match(fontAwesomeSvg, /viewBox="0 0 640 512"/);
  assert.match(remixSvg, /viewBox="0 0 24 24"/);
  assert.match(lucideCircleSvg, /<svg[^>]+fill="#000000"[^>]+stroke="none"/);
  assert.match(lucideStrokeSvg, /<svg[^>]+fill="#000000"[^>]+stroke="none"/);
  assert.match(lucideDeleteSvg, /<svg[^>]+fill="#000000"[^>]+stroke="none"/);
  assert.equal((lucideCircleSvg.match(/<path/g) ?? []).length, 1);
  assert.equal((lucideCircleSvg.match(/M/g) ?? []).length, 2);
  assert.ok((lucideStrokeSvg.match(/M/g) ?? []).length > 1);
  assert.ok((lucideDeleteSvg.match(/M/g) ?? []).length > 1);
  assert.equal((lucideCommandSvg.match(/<path/g) ?? []).length, 1);
  assert.ok((lucideCommandSvg.match(/M/g) ?? []).length > 1);
  assert.doesNotMatch(lucideStrokeSvg, /stroke-width=/);
  assert.doesNotMatch(lucideDeleteSvg, /stroke-width=/);
  assert.doesNotMatch(lucideStrokeSvg, /<circle/);
  assert.doesNotMatch(lucideStrokeSvg, /\skey="/);
});
