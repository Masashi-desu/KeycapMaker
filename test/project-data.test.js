import test from "node:test";
import assert from "node:assert/strict";

import { createDefaultKeycapParams } from "../src/data/keycap-shape-registry.js";
import {
  DEFAULT_PROJECT_NAME,
  PROJECT_DATA_KIND,
  PROJECT_DATA_SCHEMA_VERSION,
  assignProjectKeycapDisplayOrder,
  createEmptyProjectState,
  createProjectKeycapEntriesForSave,
  createProjectKeycapEntry,
  createProjectManifest,
  createProjectPreviewPlaceholderDataUrl,
  findProjectManifestPath,
  getProjectAssetMimeType,
  getProjectPreviewImageExtension,
  isProjectManifestPayload,
  isProjectArchiveFileName,
  normalizeProjectAssetPath,
  normalizeProjectName,
  parseProjectManifest,
} from "../src/lib/project-data.js";

test("プロジェクト名とプロジェクト内パスをファイル保存向けに正規化する", () => {
  assert.equal(normalizeProjectName("  My/Project?.json  "), "My-Project-");
  assert.equal(normalizeProjectName(""), DEFAULT_PROJECT_NAME);
  assert.equal(normalizeProjectAssetPath("\\keycaps\\esc.json"), "keycaps/esc.json");
  assert.equal(normalizeProjectAssetPath("../outside.json", "fallback.json"), "fallback.json");
});

test("現在のキーキャップからプロジェクト内キーキャップ定義を作る", () => {
  const params = {
    ...createDefaultKeycapParams("custom-shell"),
    name: "ESC",
    legendText: "Esc",
  };
  const entry = createProjectKeycapEntry(params, {
    id: "keycap-test",
    previewImageDataUrl: "data:image/png;base64,AA==",
    previewViewState: {
      direction: [1, 2, 3],
      distanceScale: 4,
      targetScale: [0, 0, 0],
      viewOffsetRatio: [0.1, -0.2],
    },
  });

  assert.equal(entry.id, "keycap-test");
  assert.equal(entry.name, "ESC");
  assert.equal(entry.jsonPath, "keycaps/ESC-test.json");
  assert.equal(entry.previewPath, "keycaps/ESC-test.png");
  assert.equal(entry.threeMfPath, "3mf/ESC-test.3mf");
  assert.equal(entry.displayOrder, 0);
  assert.equal(entry.params.name, "ESC");
  assert.equal(entry.editorDataPayload.params.legendText, "Esc");
  assert.deepEqual(entry.previewViewState, {
    direction: [1, 2, 3],
    distanceScale: 4,
    targetScale: [0, 0, 0],
    viewOffsetRatio: [0.1, -0.2],
  });
});

test("プロジェクト manifest を作成し、読み戻せる", () => {
  const params = {
    ...createDefaultKeycapParams("typewriter"),
    name: "A",
  };
  const entry = createProjectKeycapEntry(params, {
    id: "keycap-a",
    previewImageDataUrl: "data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E",
    previewViewState: {
      direction: [0.5, 0.5, 0.7],
      distanceScale: 3.2,
      targetScale: [0, 0, 0],
      viewOffsetRatio: [0, 0.12],
    },
  });
  const project = createEmptyProjectState({
    name: "Demo Project",
    keycaps: [entry],
    activeKeycapId: "keycap-a",
  });
  const manifest = createProjectManifest(project, "2026-04-30T00:00:00.000Z");
  const parsed = parseProjectManifest(manifest);

  assert.equal(manifest.kind, PROJECT_DATA_KIND);
  assert.equal(manifest.schemaVersion, PROJECT_DATA_SCHEMA_VERSION);
  assert.equal(manifest.savedAt, "2026-04-30T00:00:00.000Z");
  assert.equal(isProjectManifestPayload(manifest), true);
  assert.deepEqual(parsed.keycaps, manifest.keycaps);
  assert.equal(manifest.keycaps[0].displayOrder, 0);
  assert.deepEqual(parsed.keycaps[0].previewViewState, entry.previewViewState);
  assert.equal(parsed.activeKeycapId, "keycap-a");
});

test("キーキャップの表示順を displayOrder で保持し、一覧順に振り直す", () => {
  const params = createDefaultKeycapParams("custom-shell");
  const entryA = createProjectKeycapEntry({ ...params, name: "A" }, {
    id: "keycap-a",
    displayOrder: 10,
  });
  const entryB = createProjectKeycapEntry({ ...params, name: "B" }, {
    id: "keycap-b",
    displayOrder: 5,
  });
  const project = createEmptyProjectState({
    name: "Ordered Project",
    keycaps: [entryA, entryB],
  });
  const manifest = createProjectManifest({
    ...project,
    keycaps: assignProjectKeycapDisplayOrder([entryA, entryB]),
  }, "2026-04-30T00:00:00.000Z");
  const parsed = parseProjectManifest({
    ...manifest,
    keycaps: [
      { ...manifest.keycaps[0], displayOrder: 1 },
      { ...manifest.keycaps[1], displayOrder: 0 },
    ],
  });

  assert.deepEqual(project.keycaps.map((entry) => entry.id), ["keycap-b", "keycap-a"]);
  assert.deepEqual(project.keycaps.map((entry) => entry.displayOrder), [0, 1]);
  assert.deepEqual(manifest.keycaps.map((entry) => entry.displayOrder), [0, 1]);
  assert.deepEqual(parsed.keycaps.map((entry) => entry.id), ["keycap-b", "keycap-a"]);
  assert.deepEqual(parsed.keycaps.map((entry) => entry.displayOrder), [0, 1]);
});

test("プロジェクト保存前のキーキャップ定義は現在の一覧順で正規化する", () => {
  const params = createDefaultKeycapParams("custom-shell");
  const entries = [
    createProjectKeycapEntry({ ...params, name: "First" }, {
      id: "keycap-first",
      displayOrder: 7,
      threeMfPath: "keycaps/First-first.3mf",
      previewImageDataUrl: "data:image/png;base64,AA==",
      previewViewState: {
        direction: [1, 0, 0],
        distanceScale: 2,
        targetScale: [0, 0, 0],
        viewOffsetRatio: [0, 0],
      },
    }),
    createProjectKeycapEntry({ ...params, name: "Second" }, {
      id: "keycap-second",
      displayOrder: 3,
      previewImageDataUrl: "data:image/png;base64,BB==",
      previewViewState: {
        direction: [0, 1, 0],
        distanceScale: 3,
        targetScale: [0, 0, 0],
        viewOffsetRatio: [0.1, 0.2],
      },
    }),
  ];

  const normalized = createProjectKeycapEntriesForSave(entries);

  assert.deepEqual(normalized.map((entry) => entry.id), ["keycap-first", "keycap-second"]);
  assert.deepEqual(normalized.map((entry) => entry.displayOrder), [0, 1]);
  assert.deepEqual(normalized.map((entry) => entry.previewViewState?.direction), [[1, 0, 0], [0, 1, 0]]);
  assert.deepEqual(normalized.map((entry) => entry.threeMfPath), ["3mf/First-first.3mf", "3mf/Second-second.3mf"]);
  assert.deepEqual(normalized.map((entry) => entry.editorDataPayload.params.name), ["First", "Second"]);
});

test("プロジェクト manifest 以外の JSON は拒否する", () => {
  assert.equal(isProjectManifestPayload({ kind: "keycap-maker/editor-params" }), false);
  assert.throws(
    () => parseProjectManifest({ kind: "keycap-maker/editor-params", schemaVersion: 5 }),
    /プロジェクト JSON/,
  );
});

test("プレビュー画像 data URL の拡張子を解決し、placeholder は SVG として扱う", () => {
  const placeholder = createProjectPreviewPlaceholderDataUrl({
    name: "あ",
    legendText: "A",
    bodyColor: "#abcdef",
  });

  assert.equal(getProjectPreviewImageExtension("data:image/webp;base64,AA=="), "webp");
  assert.equal(getProjectPreviewImageExtension(placeholder), "svg");
  assert.match(decodeURIComponent(placeholder), /<svg/);
});

test("プロジェクト ZIP / ZLP 名と archive 内 manifest path を解決する", () => {
  assert.equal(isProjectArchiveFileName("Demo.zip"), true);
  assert.equal(isProjectArchiveFileName("Demo.zlp"), true);
  assert.equal(isProjectArchiveFileName("Demo.json"), false);
  assert.equal(findProjectManifestPath([
    "__MACOSX/Demo/KeycapMaker.json",
    "Demo/keycaps/A.json",
    "Demo/KeycapMaker.json",
  ]), "Demo/KeycapMaker.json");
});

test("プロジェクト asset の MIME type を path から解決する", () => {
  assert.equal(getProjectAssetMimeType("keycaps/a.png"), "image/png");
  assert.equal(getProjectAssetMimeType("keycaps/a.svg"), "image/svg+xml");
  assert.equal(getProjectAssetMimeType("keycaps/a.json"), "application/json");
  assert.equal(getProjectAssetMimeType("3mf/a.3mf"), "model/3mf");
  assert.equal(getProjectAssetMimeType("keycaps/a.bin"), "application/octet-stream");
});
