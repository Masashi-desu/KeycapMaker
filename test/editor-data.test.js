import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createDefaultKeycapParams } from "../src/data/keycap-shape-registry.js";
import {
  createEditorDataPayload,
  EDITOR_DATA_KIND,
  EDITOR_DATA_SCHEMA_VERSION,
  getTopSurfaceShapePreset,
  parseEditorDataPayload,
  sanitizeExportBaseName,
  syncDerivedKeycapParams,
} from "../src/lib/editor-data.js";

async function loadFixture(name) {
  const fixtureUrl = new URL(`./fixtures/${name}`, import.meta.url);
  const text = await readFile(fixtureUrl, "utf8");
  return JSON.parse(text);
}

test("互換入力 JSON は欠損した typewriter パラメータを defaults で補完する", async () => {
  const payload = await loadFixture("editor-data-sparse-typewriter.json");
  const defaults = createDefaultKeycapParams("typewriter");
  const parsed = parseEditorDataPayload(payload);

  assert.equal(parsed.shapeProfile, "typewriter");
  assert.equal(parsed.name, "Typewriter patch");
  assert.equal(parsed.rimEnabled, false);
  assert.equal(parsed.rimWidth, defaults.rimWidth);
  assert.equal(parsed.rimHeightUp, defaults.rimHeightUp);
  assert.equal(parsed.rimHeightDown, defaults.rimHeightDown);
  assert.equal(parsed.typewriterMountHeight, defaults.typewriterMountHeight);
  assert.equal(parsed.legendText, "ESC");
  assert.equal(parsed.legendFontKey, "orbitron-regular");
  assert.equal(parsed.legendFontStyleKey, "font-default");
  assert.equal(parsed.stemType, defaults.stemType);
  assert.equal(parsed.topSlopeInputMode, defaults.topSlopeInputMode);
  assert.equal(parsed.topSurfaceShape, defaults.topSurfaceShape);
  assert.equal(parsed.stemEnabled, true);
  assert.ok(Number.isFinite(parsed.topFrontHeight));
  assert.ok(Number.isFinite(parsed.topVisibleCenterHeight));

  const exported = createEditorDataPayload(parsed);
  assert.equal(exported.kind, EDITOR_DATA_KIND);
  assert.equal(exported.schemaVersion, EDITOR_DATA_SCHEMA_VERSION);
  assert.deepEqual(
    Object.keys(exported.params).sort(),
    Object.keys(defaults).sort(),
  );
  assert.equal(exported.params.rimWidth, defaults.rimWidth);
  assert.equal(exported.params.rimEnabled, false);
});

test("kind なしの疎 JSON も top-level パラメータを bind して不足分を補完する", async () => {
  const payload = await loadFixture("editor-data-sparse-top-level.json");
  const defaults = createDefaultKeycapParams("custom-shell");
  const parsed = parseEditorDataPayload(payload);

  assert.equal(parsed.shapeProfile, "custom-shell");
  assert.equal(parsed.name, "top-level partial");
  assert.equal(parsed.legendEnabled, false);
  assert.equal(parsed.topCenterHeight, 11.2);
  assert.equal(parsed.topScale, defaults.topScale);
  assert.equal(parsed.topSurfaceShape, defaults.topSurfaceShape);
  assert.equal(parsed.homingBarEnabled, defaults.homingBarEnabled);
  assert.equal(parsed.homingBarChamfer, defaults.homingBarChamfer);
  assert.equal(parsed.legendFontKey, defaults.legendFontKey);
  assert.ok(Number.isFinite(parsed.topBackHeight));
});

test("homing bar の面取り量は負数を 0 に丸める", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    homingBarChamfer: -0.4,
  });

  assert.equal(parsed.homingBarChamfer, 0);
});

test("旧 dish 指定だけの入力は spherical として解釈する", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    dishDepth: 0.8,
  });

  assert.equal(parsed.topSurfaceShape, "spherical");
  assert.equal(parsed.topVisibleCenterHeight, parsed.topCenterHeight - 0.8);
});

test("負の深さは盛り上がりとして中央表面を上げる", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topSurfaceShape: "cylindrical",
    dishDepth: -0.6,
  });

  assert.equal(parsed.topSurfaceShape, "cylindrical");
  assert.equal(parsed.topVisibleCenterHeight, parsed.topCenterHeight + 0.6);
});

test("typewriter は spherical top を受ける", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "typewriter",
    topSurfaceShape: "spherical",
    dishDepth: 0.8,
  });

  assert.equal(parsed.topSurfaceShape, "spherical");
  assert.equal(parsed.topVisibleCenterHeight, parsed.topCenterHeight - 0.8);
});

test("typewriter は cylindrical top を受けず default へ戻す", () => {
  const defaults = createDefaultKeycapParams("typewriter");
  const parsed = parseEditorDataPayload({
    shapeProfile: "typewriter",
    topSurfaceShape: "cylindrical",
    dishDepth: 0.7,
  });

  assert.equal(parsed.topSurfaceShape, defaults.topSurfaceShape);
  assert.equal(parsed.topVisibleCenterHeight, parsed.topCenterHeight);
});

test("typewriter の上面基準高さは本体厚みより下に丸める", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "typewriter",
    topCenterHeight: 5.2,
    typewriterMountHeight: 4.0,
  });

  assert.ok(Math.abs(parsed.typewriterMountHeight - 5.78) < 1e-9);
});

test("typewriter のキー寸法が一時的に 0 になってもキーリム幅を失わない", () => {
  const defaults = createDefaultKeycapParams("typewriter");
  const params = syncDerivedKeycapParams({
    ...defaults,
    keyWidth: 0,
    rimEnabled: true,
    rimWidth: defaults.rimWidth,
  });

  assert.equal(params.keyWidth, defaults.keyWidth);
  assert.equal(params.rimWidth, defaults.rimWidth);
});

test("typewriter の空キー寸法入力は default で補完しキーリム幅を維持する", () => {
  const defaults = createDefaultKeycapParams("typewriter");
  const parsed = parseEditorDataPayload({
    shapeProfile: "typewriter",
    keyWidth: "",
    keyDepth: "",
    rimEnabled: true,
    rimWidth: defaults.rimWidth,
  });

  assert.equal(parsed.keyWidth, defaults.keyWidth);
  assert.equal(parsed.keyDepth, defaults.keyDepth);
  assert.equal(parsed.rimWidth, defaults.rimWidth);
});

test("キートップ形状ごとの代表プリセットを返す", () => {
  assert.deepEqual(getTopSurfaceShapePreset("flat"), {
    dishDepth: 0,
  });
  assert.deepEqual(getTopSurfaceShapePreset("cylindrical"), {
    dishDepth: 0.7,
  });
  assert.deepEqual(getTopSurfaceShapePreset("spherical"), {
    dishDepth: 1.0,
  });
});

test("印字サイズの初期値は 5mm にする", () => {
  assert.equal(createDefaultKeycapParams("custom-shell").legendSize, 5.0);
  assert.equal(createDefaultKeycapParams("typewriter").legendSize, 5.0);
});

test("保存名の拡張子正規化は STL も対象にする", () => {
  assert.equal(sanitizeExportBaseName("sample.stl"), "sample");
  assert.equal(sanitizeExportBaseName("sample.3mf"), "sample");
  assert.equal(sanitizeExportBaseName("sample.json"), "sample");
});
