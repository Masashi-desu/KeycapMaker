import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createDefaultKeycapParams } from "../src/data/keycap-shape-registry.js";
import {
  createEditorDataPayload,
  EDITOR_DATA_KIND,
  EDITOR_DATA_SCHEMA_VERSION,
  parseEditorDataPayload,
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
  assert.equal(parsed.legendText, "ESC");
  assert.equal(parsed.legendFontKey, "orbitron-regular");
  assert.equal(parsed.legendFontStyleKey, "font-default");
  assert.equal(parsed.stemType, defaults.stemType);
  assert.equal(parsed.topSlopeInputMode, defaults.topSlopeInputMode);
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
  assert.equal(parsed.homingBarEnabled, defaults.homingBarEnabled);
  assert.equal(parsed.legendFontKey, defaults.legendFontKey);
  assert.ok(Number.isFinite(parsed.topBackHeight));
});
