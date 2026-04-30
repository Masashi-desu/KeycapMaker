import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createDefaultKeycapParams } from "../src/data/keycap-shape-registry.js";
import {
  createEditorDataPayload,
  deleteEditorDataPayloadPath,
  EDITOR_DATA_KIND,
  EDITOR_DATA_SCHEMA_VERSION,
  getTopSurfaceShapePreset,
  mergeEditorDataPayloadParams,
  parseEditorDataPayload,
  parseEditorDataPayloadWithReport,
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
  assert.equal(parsed.topOffsetX, defaults.topOffsetX);
  assert.equal(parsed.topOffsetY, defaults.topOffsetY);
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

test("JSON 読み込み時に bind できないパラメータを報告する", () => {
  const { params, bindingReport } = parseEditorDataPayloadWithReport({
    shapeProfile: "typewriter",
    keyWidth: 19,
    topCornerRadius: 2,
    oldCustomField: true,
    params: {
      keyDepth: 18.5,
      legacyNestedField: 4,
    },
  });

  assert.equal(params.shapeProfile, "typewriter");
  assert.equal(params.keyWidth, 19);
  assert.equal(params.keyDepth, 18.5);
  assert.equal(bindingReport.profileKey, "typewriter");
  assert.deepEqual(
    bindingReport.unboundParams.map((entry) => entry.path).sort(),
    ["oldCustomField", "params.legacyNestedField", "topCornerRadius"].sort(),
  );
  assert.deepEqual(
    Object.fromEntries(bindingReport.unboundParams.map((entry) => [entry.path, entry.value])),
    {
      oldCustomField: true,
      "params.legacyNestedField": 4,
      topCornerRadius: 2,
    },
  );
});

test("現行形式 JSON の top-level に残った未対応パラメータも報告する", () => {
  const payload = createEditorDataPayload({
    ...createDefaultKeycapParams("typewriter"),
    name: "current with legacy field",
  });
  const { bindingReport } = parseEditorDataPayloadWithReport({
    ...payload,
    legacyTopLevelField: 7,
  });

  assert.deepEqual(bindingReport.unboundParams.map((entry) => entry.path), ["legacyTopLevelField"]);
  assert.equal(bindingReport.unboundParams[0].value, 7);
});

test("プロジェクト内 JSON の未対応パラメータを保持したまま既知パラメータを更新する", () => {
  const existingPayload = {
    shapeProfile: "typewriter",
    name: "legacy source",
    legacyTopLevelField: 7,
    params: {
      keyDepth: 18.5,
      legacyNestedField: 4,
    },
  };
  const nextPayload = mergeEditorDataPayloadParams(existingPayload, {
    ...createDefaultKeycapParams("typewriter"),
    name: "updated source",
    keyDepth: 19.25,
  });
  const { params, bindingReport } = parseEditorDataPayloadWithReport(nextPayload);

  assert.equal(params.name, "updated source");
  assert.equal(params.keyDepth, 19.25);
  assert.equal(nextPayload.legacyTopLevelField, 7);
  assert.equal(nextPayload.params.legacyNestedField, 4);
  assert.deepEqual(
    bindingReport.unboundParams.map((entry) => entry.path).sort(),
    ["legacyTopLevelField", "params.legacyNestedField"].sort(),
  );
});

test("読み込みレポートの path で JSON から該当パラメータだけ削除する", () => {
  const payload = {
    shapeProfile: "typewriter",
    legacyTopLevelField: 7,
    params: {
      keyDepth: 18.5,
      legacyNestedField: 4,
    },
  };
  const nestedResult = deleteEditorDataPayloadPath(payload, "params.legacyNestedField");
  const topLevelResult = deleteEditorDataPayloadPath(nestedResult.payload, "legacyTopLevelField");
  const { bindingReport } = parseEditorDataPayloadWithReport(topLevelResult.payload);

  assert.equal(nestedResult.deleted, true);
  assert.equal(topLevelResult.deleted, true);
  assert.equal(payload.params.legacyNestedField, 4);
  assert.equal(payload.legacyTopLevelField, 7);
  assert.equal(topLevelResult.payload.params.legacyNestedField, undefined);
  assert.equal(topLevelResult.payload.legacyTopLevelField, undefined);
  assert.deepEqual(bindingReport.unboundParams, []);
});

test("homing bar の面取り量は負数を 0 に丸める", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    homingBarChamfer: -0.4,
  });

  assert.equal(parsed.homingBarChamfer, 0);
});

test("ステム入口の面取り量は保持し、負数を 0 に丸める", () => {
  const defaults = createDefaultKeycapParams("custom-shell");
  const parsed = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    stemCrossChamfer: 0.2,
  });
  const rounded = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    stemCrossChamfer: -0.4,
  });

  assert.equal(defaults.stemCrossChamfer, 0);
  assert.equal(parsed.stemCrossChamfer, 0.2);
  assert.equal(rounded.stemCrossChamfer, 0);
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

test("タイプライターJISエンターは spherical top と欠き込み寸法を受ける", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "typewriter-jis-enter",
    topSurfaceShape: "spherical",
    keyWidth: 27,
    keyDepth: 36,
    jisEnterNotchWidth: 4.5,
    jisEnterNotchDepth: 18,
  });

  assert.equal(parsed.shapeProfile, "typewriter-jis-enter");
  assert.equal(parsed.topSurfaceShape, "spherical");
  assert.equal(parsed.jisEnterNotchWidth, 4.5);
  assert.equal(parsed.jisEnterNotchDepth, 18);
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

test("キートップ中心オフセットは保存データへ保持する", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topOffsetX: 1.25,
    topOffsetY: -2.5,
  });

  assert.equal(parsed.topOffsetX, 1.25);
  assert.equal(parsed.topOffsetY, -2.5);
  const exported = createEditorDataPayload(parsed);
  assert.equal(exported.params.topOffsetX, 1.25);
  assert.equal(exported.params.topOffsetY, -2.5);
});

test("印字サイズの初期値は 5mm にする", () => {
  assert.equal(createDefaultKeycapParams("custom-shell").legendSize, 5.0);
  assert.equal(createDefaultKeycapParams("jis-enter").legendSize, 5.0);
  assert.equal(createDefaultKeycapParams("typewriter").legendSize, 5.0);
  assert.equal(createDefaultKeycapParams("typewriter-jis-enter").legendSize, 5.0);
});

test("キートップ四隅の印字は中央と同じパラメータセットを持つ", () => {
  const shapeKeys = ["custom-shell", "jis-enter", "typewriter", "typewriter-jis-enter"];
  const prefixes = ["topLegendRightTop", "topLegendRightBottom", "topLegendLeftTop", "topLegendLeftBottom"];
  const textDefaults = {
    topLegendLeftTopText: "1",
    topLegendRightTopText: "2",
    topLegendLeftBottomText: "3",
    topLegendRightBottomText: "4",
  };
  const offsetDefaults = {
    "custom-shell": { x: 0.72, y: 0.72 },
    "jis-enter": { x: 1.08, y: 1.44 },
    "typewriter": { x: 0.72, y: 0.72 },
    "typewriter-jis-enter": { x: 1.08, y: 1.44 },
  };
  const suffixes = [
    "Enabled",
    "Color",
    "Text",
    "FontKey",
    "FontStyleKey",
    "UnderlineEnabled",
    "Size",
    "OutlineDelta",
    "Height",
    "Embed",
    "OffsetX",
    "OffsetY",
  ];

  for (const shapeKey of shapeKeys) {
    const defaults = createDefaultKeycapParams(shapeKey);
    const { x, y } = offsetDefaults[shapeKey];
    const expectedOffsets = {
      topLegendLeftTop: { x, y: -y },
      topLegendRightTop: { x: -x, y: -y },
      topLegendLeftBottom: { x, y },
      topLegendRightBottom: { x: -x, y },
    };

    for (const prefix of prefixes) {
      for (const suffix of suffixes) {
        assert.ok(`${prefix}${suffix}` in defaults);
      }

      assert.equal(defaults[`${prefix}Enabled`], false);
      assert.equal(defaults[`${prefix}Size`], 3.5);
      assert.equal(defaults[`${prefix}Height`], 0);
      assert.equal(defaults[`${prefix}Embed`], 0.6);
      assert.equal(defaults[`${prefix}Color`], "#212529");
      assert.equal(defaults[`${prefix}OffsetX`], expectedOffsets[prefix].x);
      assert.equal(defaults[`${prefix}OffsetY`], expectedOffsets[prefix].y);
    }
    for (const [textKey, expectedText] of Object.entries(textDefaults)) {
      assert.equal(defaults[textKey], expectedText);
    }
  }
});

test("サイドウォール印字サイズは4mm、高さ初期値は面一にする", () => {
  const shapeKeys = ["custom-shell", "jis-enter", "typewriter", "typewriter-jis-enter"];
  const sideSizeKeys = ["sideLegendFrontSize", "sideLegendBackSize", "sideLegendLeftSize", "sideLegendRightSize"];
  const sideHeightKeys = ["sideLegendFrontHeight", "sideLegendBackHeight", "sideLegendLeftHeight", "sideLegendRightHeight"];
  const sideTextDefaults = {
    sideLegendFrontText: "F",
    sideLegendBackText: "B",
    sideLegendLeftText: "R",
    sideLegendRightText: "F",
  };
  const sideEmbedKeys = ["sideLegendFrontEmbed", "sideLegendBackEmbed", "sideLegendLeftEmbed", "sideLegendRightEmbed"];

  for (const shapeKey of shapeKeys) {
    const defaults = createDefaultKeycapParams(shapeKey);

    for (const sideSizeKey of sideSizeKeys) {
      assert.equal(defaults[sideSizeKey], 4.0);
    }
    for (const [sideTextKey, expectedText] of Object.entries(sideTextDefaults)) {
      assert.equal(defaults[sideTextKey], expectedText);
    }
    for (const sideHeightKey of sideHeightKeys) {
      assert.equal(defaults[sideHeightKey], 0);
    }
    for (const sideEmbedKey of sideEmbedKeys) {
      assert.equal(sideEmbedKey in defaults, false);
    }
  }
});

test("シェル系の上面すぼまり初期値は一般的なキーキャップ比率にする", () => {
  assert.equal(createDefaultKeycapParams("custom-shell").topScale, 0.75);
  assert.equal(createDefaultKeycapParams("jis-enter").topScale, 0.75);
  assert.equal(createDefaultKeycapParams("typewriter").topScale, 1);
  assert.equal(createDefaultKeycapParams("typewriter-jis-enter").topScale, 1);
});

test("custom shell の上面Rは共通値と個別値を保持し上面内に丸める", () => {
  const shared = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topCornerRadius: 2.4,
    topCornerRadiusIndividualEnabled: false,
    topCornerRadiusLeftTop: 4.2,
  });
  const individual = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topCornerRadius: 99,
    topCornerRadiusIndividualEnabled: true,
    topCornerRadiusLeftTop: 1,
    topCornerRadiusRightTop: 99,
    topCornerRadiusRightBottom: 3,
    topCornerRadiusLeftBottom: 4,
  });

  assert.equal(shared.topCornerRadius, 2.4);
  assert.equal(shared.topCornerRadiusLeftTop, 2.4);
  assert.equal(shared.topCornerRadiusRightTop, 2.4);
  assert.equal(shared.topCornerRadiusRightBottom, 2.4);
  assert.equal(shared.topCornerRadiusLeftBottom, 2.4);

  assert.equal(individual.topCornerRadius, 6.75);
  assert.equal(individual.topCornerRadiusIndividualEnabled, true);
  assert.equal(individual.topCornerRadiusLeftTop, 1);
  assert.equal(individual.topCornerRadiusRightTop, 6.75);
  assert.equal(individual.topCornerRadiusRightBottom, 3);
  assert.equal(individual.topCornerRadiusLeftBottom, 4);
});

test("JISエンターは欠き込み寸法をキー寸法内に丸める", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "jis-enter",
    keyWidth: 27,
    keyDepth: 36,
    jisEnterNotchWidth: 99,
    jisEnterNotchDepth: 99,
  });

  assert.equal(parsed.shapeProfile, "jis-enter");
  assert.equal(parsed.jisEnterNotchWidth, 26.8);
  assert.equal(parsed.jisEnterNotchDepth, 35.8);
  assert.equal(parsed.topSurfaceShape, "flat");
});

test("JISエンターの既定寸法はステム原点を下胴中央に置く", () => {
  const params = createDefaultKeycapParams("jis-enter");
  const left = -params.keyWidth / 2 - params.jisEnterNotchWidth / 2;
  const right = params.keyWidth / 2 - params.jisEnterNotchWidth / 2;
  const notchX = left + params.jisEnterNotchWidth;
  const lowerBodyCenterX = (notchX + right) / 2;
  const lowerBodyWidth = right - notchX;

  assert.equal(lowerBodyCenterX, 0);
  assert.equal(lowerBodyWidth, 22.5);
  assert.equal(params.keyDepth, 36);
  assert.equal(params.jisEnterNotchDepth, 18);
});

test("top-hat パラメータは対応形状ごとに保持し上面内に丸める", () => {
  const wideTopHat = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topHatEnabled: true,
    topHatTopWidth: 99,
    topHatTopDepth: 99,
    topHatTopRadius: 99,
    topHatHeight: 20,
    topHatShoulderAngle: 100,
    topHatShoulderRadius: 99,
  });
  const smallTopHat = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topHatEnabled: true,
    topHatTopWidth: 3,
    topHatTopDepth: 3,
    topHatTopRadius: 99,
    topHatHeight: 20,
    topHatShoulderAngle: 45,
    topHatShoulderRadius: 0.6,
  });
  const individualTopHat = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topHatEnabled: true,
    topHatTopWidth: 4,
    topHatTopDepth: 6,
    topHatTopRadius: 1.2,
    topHatTopRadiusIndividualEnabled: true,
    topHatTopRadiusLeftTop: 0.4,
    topHatTopRadiusRightTop: 99,
    topHatTopRadiusRightBottom: 1.6,
    topHatTopRadiusLeftBottom: 2.4,
  });
  const recessedTopHat = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topHatEnabled: true,
    topHatHeight: -99,
  });
  const shallowRecessTopHat = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topHatEnabled: true,
    topHatHeight: -0.8,
    topHatShoulderRadius: -0.4,
  });
  const overRadiusRecessTopHat = parseEditorDataPayload({
    shapeProfile: "custom-shell",
    topHatEnabled: true,
    topHatHeight: -0.5,
    topHatShoulderRadius: -1.0,
  });
  const jisTopHat = parseEditorDataPayload({
    shapeProfile: "jis-enter",
    topHatEnabled: true,
    topHatInset: 99,
    topHatTopRadius: 99,
    topHatHeight: 20,
    topHatShoulderRadius: 99,
  });
  const jisEnterDefaults = createDefaultKeycapParams("jis-enter");

  assert.equal(wideTopHat.topHatEnabled, true);
  assert.ok(wideTopHat.topHatTopWidth < wideTopHat.keyWidth);
  assert.ok(wideTopHat.topHatTopDepth < wideTopHat.keyDepth);
  assert.equal(wideTopHat.topHatTopRadius, Math.min(wideTopHat.topHatTopWidth, wideTopHat.topHatTopDepth) / 2);
  assert.equal(wideTopHat.topHatShoulderAngle, 85);
  assert.ok(wideTopHat.topHatShoulderRadius <= 0.001);
  assert.ok(wideTopHat.topHatHeight <= 0.051);
  assert.ok(smallTopHat.topHatHeight > wideTopHat.topHatHeight);
  assert.equal(smallTopHat.topHatShoulderRadius, 0.6);
  assert.equal(individualTopHat.topHatTopRadiusIndividualEnabled, true);
  assert.equal(individualTopHat.topHatTopRadiusLeftTop, 0.4);
  assert.equal(individualTopHat.topHatTopRadiusRightTop, 2);
  assert.equal(individualTopHat.topHatTopRadiusRightBottom, 1.6);
  assert.equal(individualTopHat.topHatTopRadiusLeftBottom, 2);
  assert.ok(Math.abs(recessedTopHat.topHatHeight + 1.45) < 1e-9);
  assert.equal(shallowRecessTopHat.topHatHeight, -0.8);
  assert.equal(shallowRecessTopHat.topHatShoulderRadius, -0.4);
  assert.equal(overRadiusRecessTopHat.topHatShoulderRadius, -0.5);
  assert.equal("topHatTopWidth" in jisTopHat, false);
  assert.equal(jisTopHat.topHatEnabled, true);
  assert.ok(jisTopHat.topHatInset < jisTopHat.keyWidth / 2);
  assert.ok(jisTopHat.topHatTopRadius < 3);
  assert.equal(jisTopHat.topHatTopRadiusIndividualEnabled, false);
  assert.equal(jisTopHat.topHatTopRadiusLeftTop, jisTopHat.topHatTopRadius);
  assert.ok(jisTopHat.topHatHeight < 20);
  assert.ok(jisTopHat.topHatShoulderRadius <= jisTopHat.topHatInset);
  assert.equal(jisEnterDefaults.topHatEnabled, false);
});

test("タイプライターJISエンターの既定寸法もステム原点を下胴中央に置く", () => {
  const params = createDefaultKeycapParams("typewriter-jis-enter");
  const left = -params.keyWidth / 2 - params.jisEnterNotchWidth / 2;
  const right = params.keyWidth / 2 - params.jisEnterNotchWidth / 2;
  const notchX = left + params.jisEnterNotchWidth;
  const lowerBodyCenterX = (notchX + right) / 2;

  assert.equal(lowerBodyCenterX, 0);
  assert.equal(params.typewriterMountHeight, 11.68);
  assert.equal(params.rimEnabled, true);
});

test("タイプライターJISエンターはRとリム幅をJIS footprint内に丸める", () => {
  const parsed = parseEditorDataPayload({
    shapeProfile: "typewriter-jis-enter",
    keyWidth: 27,
    keyDepth: 36,
    jisEnterNotchWidth: 4.5,
    jisEnterNotchDepth: 18,
    typewriterCornerRadius: 99,
    rimWidth: 99,
  });

  assert.equal(parsed.typewriterCornerRadius, 9);
  assert.equal(parsed.rimWidth, 9);
});

test("保存名の拡張子正規化は STL も対象にする", () => {
  assert.equal(sanitizeExportBaseName("sample.stl"), "sample");
  assert.equal(sanitizeExportBaseName("sample.3mf"), "sample");
  assert.equal(sanitizeExportBaseName("sample.json"), "sample");
});
