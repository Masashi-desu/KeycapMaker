import "./styles.css";
import minimumPocScad from "../scad/samples/minimum-poc.scad?raw";
import { runOpenScad } from "./lib/openscad-client.js";
import { create3mfBlob } from "./lib/export-3mf.js";
import { parseOff } from "./lib/off-parser.js";
import { buildKeycapArgs, createKeycapFiles } from "./lib/keycap-scad-bundle.js";

const app = document.querySelector("#app");
const samplePath = "/samples/minimum-poc.scad";
const previewOutputPath = "/outputs/minimum-poc.off";
const keycapBodyPath = "/outputs/keycap-body.stl";
const keycapLegendPath = "/outputs/keycap-legend.stl";
const keycapBodyPreviewPath = "/outputs/keycap-body-preview.off";
const keycapLegendPreviewPath = "/outputs/keycap-legend-preview.off";
const keycap3mfPath = "keycap-preview.3mf";
let disposePreviewScene = null;
let previewDebounceTimer = 0;
let previewSceneModulePromise = null;
let viewportLayoutMode = getViewportLayoutMode();
const textDecoder = new TextDecoder();
const previewLayerPalette = {
  body: 0x4d8fd8,
  legend: 0xf5b942,
};

const workspaceSections = [
  {
    id: "params",
    label: "パラメータ",
  },
  {
    id: "guide",
    label: "使い方",
  },
  {
    id: "export",
    label: "エクスポート",
  },
];

const workspaceDraft = {
  profileName: "Custom 1u",
  legendExample: "ESC",
  materialLabel: "Resin test mock",
};

const fieldGroups = [
  {
    title: "本体",
    description: "キーキャップ外形とテーパー。profile 切替前でも共通で使う基本寸法です。",
    fields: [
      { key: "keyWidth", label: "幅", hint: "ベース外形", unit: "mm", step: 0.1, min: 10 },
      { key: "keyDepth", label: "奥行き", hint: "前後方向", unit: "mm", step: 0.1, min: 10 },
      { key: "bodyHeight", label: "高さ", hint: "天面までの基準高さ", unit: "mm", step: 0.1, min: 1 },
      { key: "wallThickness", label: "肉厚", hint: "シェル厚み", unit: "mm", step: 0.05, min: 0.4 },
      { key: "topScale", label: "上面スケール", hint: "上面比率に応じてテーパーを補正", unit: "ratio", step: 0.01, min: 0.5, max: 1 },
    ],
  },
  {
    title: "印字",
    description: "印字用 legend body の占有範囲と高さです。ホーミングバーとは別オプションで扱います。",
    fields: [
      { key: "legendEnabled", label: "印字を有効化", hint: "body と legend を別 volume で扱う", type: "checkbox" },
      { key: "legendWidth", label: "印字幅", hint: "文字面の横幅", unit: "mm", step: 0.1, min: 0.5 },
      { key: "legendDepth", label: "印字奥行き", hint: "文字面の縦幅", unit: "mm", step: 0.1, min: 0.5 },
      { key: "legendHeight", label: "印字高さ", hint: "盛り上がりまたは彫り込みの仮量", unit: "mm", step: 0.05, min: 0.1 },
      { key: "legendOffsetX", label: "印字 X オフセット", hint: "左右位置", unit: "mm", step: 0.1 },
      { key: "legendOffsetY", label: "印字 Y オフセット", hint: "前後位置", unit: "mm", step: 0.1 },
    ],
  },
  {
    title: "ホーミング",
    description: "元モデルのキートップ凸をホーミングバーとして扱います。印字とは独立した body 側オプションです。",
    fields: [
      { key: "homingBarEnabled", label: "ホーミングバーを有効化", hint: "触覚マーカーを body に追加", type: "checkbox" },
      { key: "homingBarLength", label: "バー長さ", hint: "左右方向の長さ", unit: "mm", step: 0.1, min: 0.5 },
      { key: "homingBarWidth", label: "バー幅", hint: "バーの太さ", unit: "mm", step: 0.05, min: 0.1 },
      { key: "homingBarHeight", label: "バー高さ", hint: "天面からの突出量", unit: "mm", step: 0.05, min: 0.05 },
      { key: "homingBarOffsetY", label: "バー Y オフセット", hint: "前後位置", unit: "mm", step: 0.1 },
      { key: "homingBarBaseThickness", label: "バー接地厚み", hint: "天面との接地厚み", unit: "mm", step: 0.05, min: 0.05 },
    ],
  },
  {
    title: "Stem",
    description: "Choc v2 stem の基準パラメータ。方式差分は将来ここへ吸収します。",
    fields: [
      {
        key: "stemType",
        label: "Stem 方式",
        hint: "現在は Choc v2 のみ。将来はここで切り替えます。",
        type: "select",
        options: [
          { value: "none", label: "なし" },
          { value: "choc_v2", label: "Choc v2" },
        ],
      },
      { key: "stemWidth", label: "Stem 幅", hint: "外径の基準値", unit: "mm", step: 0.1, min: 0.5 },
      { key: "stemDepth", label: "Stem 奥行き", hint: "外径の補助値", unit: "mm", step: 0.1, min: 0.5 },
      { key: "stemHeight", label: "Stem 高さ", hint: "底面からの実高さ", unit: "mm", step: 0.1, min: 0.1 },
      { key: "stemInset", label: "Stem inset", hint: "底面からの開始位置", unit: "mm", step: 0.1, min: 0.1 },
    ],
  },
];

const state = {
  runtimeStatus: "idle",
  runtimeSummary: "未実行",
  logs: [],
  error: "",
  exportsStatus: "idle",
  exportsSummary: "未生成",
  exportHistory: [],
  editorStatus: "idle",
  editorSummary: "未生成",
  editorLogs: [],
  editorError: "",
  previewLayers: [],
  sidebarTab: "params",
  keycapParams: {
    keyWidth: 18,
    keyDepth: 18,
    bodyHeight: 9.5,
    wallThickness: 1.2,
    topScale: 0.84,
    legendEnabled: true,
    legendWidth: 7.2,
    legendDepth: 4.0,
    legendHeight: 0.8,
    legendOffsetX: 0,
    legendOffsetY: 0,
    homingBarEnabled: true,
    homingBarLength: 4.0,
    homingBarWidth: 1.58,
    homingBarHeight: 0.6,
    homingBarOffsetY: -3.5,
    homingBarBaseThickness: 0.35,
    stemType: "choc_v2",
    stemEnabled: true,
    stemWidth: 5.5,
    stemDepth: 5.5,
    stemHeight: 6.5,
    stemInset: 0.5,
  },
};

function syncDerivedKeycapParams() {
  state.keycapParams.stemEnabled = state.keycapParams.stemType !== "none";
}

syncDerivedKeycapParams();

if (!app) {
  throw new Error("#app が見つかりません。");
}

function getViewportLayoutMode() {
  if (window.innerWidth <= 760) {
    return "stack";
  }

  const shellPadding = 48;
  const columnGap = 20;
  const sidebarWidth = Math.min(420, Math.max(320, window.innerWidth * 0.34));
  const previewSize = Math.min(window.innerHeight - 48, window.innerWidth - 48);
  const availableWidth = window.innerWidth - shellPadding;

  return availableWidth >= sidebarWidth + columnGap + previewSize ? "centered" : "overlap";
}

function getStatusLabel(status) {
  switch (status) {
    case "running":
      return "実行中";
    case "success":
      return "正常";
    case "error":
      return "エラー";
    case "dirty":
      return "未反映";
    default:
      return "待機";
  }
}

function getStatusTone(status) {
  switch (status) {
    case "running":
      return "warning";
    case "success":
      return "success";
    case "error":
      return "danger";
    case "dirty":
      return "info";
    default:
      return "neutral";
  }
}

function formatMillimeter(value, digits = 1) {
  return `${Number(value).toFixed(digits)} mm`;
}

function formatUnitSize() {
  return `${(state.keycapParams.keyWidth / 18).toFixed(2)}u`;
}

function formatColorHex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function createOverviewItems() {
  return [
    {
      label: "Profile",
      value: workspaceDraft.profileName,
      meta: "現在のベース形状。将来は selector に置換予定",
    },
    {
      label: "Unit Size",
      value: formatUnitSize(),
      meta: `${formatMillimeter(state.keycapParams.keyWidth)} ベースで算出`,
    },
    {
      label: "Front Height",
      value: formatMillimeter(state.keycapParams.bodyHeight),
      meta: "最終ベースの基準高さ",
    },
    {
      label: "Legend",
      value: state.keycapParams.legendEnabled ? workspaceDraft.legendExample : "Disabled",
      meta: state.keycapParams.legendEnabled
        ? `${formatMillimeter(state.keycapParams.legendWidth)} × ${formatMillimeter(state.keycapParams.legendDepth)}`
        : "body のみで出力",
    },
    {
      label: "Homing",
      value: state.keycapParams.homingBarEnabled ? "Bar" : "Disabled",
      meta: state.keycapParams.homingBarEnabled
        ? `${formatMillimeter(state.keycapParams.homingBarLength)} / Y ${formatMillimeter(state.keycapParams.homingBarOffsetY)}`
        : "触覚マーカーなし",
    },
  ];
}

function createQuickNotes() {
  return [
    {
      label: "Legend Build",
      value: state.keycapParams.legendEnabled
        ? `${formatMillimeter(state.keycapParams.legendHeight, 2)} の別ボディ`
        : "現在は無効化",
      tone: "neutral",
    },
    {
      label: "Homing Bar",
      value: state.keycapParams.homingBarEnabled
        ? `${formatMillimeter(state.keycapParams.homingBarHeight, 2)} の body 側凸`
        : "現在は無効化",
      tone: "neutral",
    },
    {
      label: "Shell Wall",
      value: `${formatMillimeter(state.keycapParams.wallThickness, 2)} を維持`,
      tone: "neutral",
    },
    {
      label: "Body Material",
      value: workspaceDraft.materialLabel,
      tone: "neutral",
    },
  ];
}

function render() {
  if (disposePreviewScene) {
    disposePreviewScene();
    disposePreviewScene = null;
  }

  app.innerHTML = `
    <main class="app-shell">
      <section class="editor-screen editor-screen--${viewportLayoutMode}">
        <aside class="left-column">
          <article class="inspector-card">
            <nav class="segment-control" aria-label="workspace sections">
              ${workspaceSections
                .map(
                  (section) => `
                    <button
                      class="segment-link ${state.sidebarTab === section.id ? "is-active" : ""}"
                      type="button"
                      data-sidebar-tab="${section.id}"
                    >
                      ${section.label}
                    </button>
                  `,
                )
                .join("")}
            </nav>
            <div class="inspector-content">
              ${renderInspectorContent()}
            </div>
          </article>
        </aside>

        <section class="right-column">
          <div class="preview-area">
            <div class="preview-stage">
              <div class="preview-stage__canvas" data-preview-stage></div>
            </div>
          </div>
        </section>
      </section>
    </main>
  `;

  app.querySelectorAll("[data-sidebar-tab]").forEach((button) => {
    button.addEventListener("click", handleSidebarTabChange);
  });
  app.querySelector("[data-run-poc]")?.addEventListener("click", executeRuntimePoc);
  app.querySelector("[data-preview-keycap]")?.addEventListener("click", executeKeycapPreview);
  app.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => executeExport(button.dataset.export));
  });
  app.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", handleFieldChange);
    input.addEventListener("change", handleFieldChange);
  });
  renderPreviewViewer();
}

function renderInspectorContent() {
  if (state.sidebarTab === "guide") {
    return renderGuideTab();
  }

  if (state.sidebarTab === "export") {
    return renderExportTab();
  }

  return renderParametersTab();
}

function renderParametersTab() {
  return `
    <div class="panel-intro">
      <h1 class="panel-title">Parameters</h1>
      <p class="panel-text">Key geometry and legend settings for the currently selected cap.</p>
    </div>

    <div class="info-chip-list">
      ${createOverviewItems()
        .slice(0, 3)
        .map(
          (item) => `
            <article class="info-chip">
              <span class="chip-label">${item.label}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>

    <section class="legend-card">
      <h2 class="subsection-title">Legend</h2>
      <div class="legend-input">
        <strong>${state.keycapParams.legendEnabled ? escapeHtml(workspaceDraft.legendExample) : "Disabled"}</strong>
      </div>
    </section>

    <div class="parameter-group-list">
      ${fieldGroups.map((group) => renderFieldGroup(group)).join("")}
    </div>

    <div class="notes-heading">Quick Notes</div>
    <div class="note-list">
      ${createQuickNotes()
        .map(
          (note) => `
            <article class="note-card note-card--${note.tone}">
              <span class="chip-label">${note.label}</span>
              <strong>${escapeHtml(note.value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>

    <button class="action-card" type="button" data-preview-keycap ${state.editorStatus === "running" ? "disabled" : ""}>
      <span class="chip-label">Next</span>
      <strong>${state.editorStatus === "running" ? "プレビュー更新中..." : "Preview mesh / legend bodies"}</strong>
    </button>
  `;
}

function renderGuideTab() {
  return `
    <div class="panel-intro">
      <h1 class="panel-title">Guide</h1>
      <p class="panel-text">PoC の確認手順と OpenSCAD runtime の状態をまとめています。</p>
    </div>

    <ol class="guide-list">
      <li class="guide-step">
        <strong>1. 左カラムで寸法を編集</strong>
        <span>key width / legend / stem を変更するとプレビューが自動更新されます。</span>
      </li>
      <li class="guide-step">
        <strong>2. 右側で mesh を確認</strong>
        <span>body と legend を別レイヤーで描画し、オブジェクト上にカーソルがあるときだけ回転・ズームできます。</span>
      </li>
      <li class="guide-step">
        <strong>3. runtime を検証</strong>
        <span>最小 SCAD を実行してブラウザ内 OpenSCAD 基盤が動作するかを確認します。</span>
      </li>
    </ol>

    ${renderStatusCard("Runtime", state.runtimeStatus, state.runtimeSummary)}

    <button class="secondary-card-button" type="button" data-run-poc ${state.runtimeStatus === "running" ? "disabled" : ""}>
      ${state.runtimeStatus === "running" ? "実行中..." : "最小 SCAD を実行"}
    </button>

    <div class="mini-code-block">
      <div class="mini-code-block__title">Runtime Logs</div>
      <pre>${state.logs.length > 0 ? escapeHtml(state.logs.join("\n")) : "ログはまだありません。"}</pre>
    </div>

    <p class="feedback-text">${state.error ? escapeHtml(state.error) : "まだエラーはありません。"}</p>
  `;
}

function renderExportTab() {
  return `
    <div class="panel-intro">
      <h1 class="panel-title">Export</h1>
      <p class="panel-text">body / legend を独立ボディとして 유지しながら STL / 3MF を出力します。</p>
    </div>

    ${renderStatusCard("Export", state.exportsStatus, state.exportsSummary)}

    <div class="export-button-list">
      <button class="secondary-card-button" type="button" data-export="body" ${state.exportsStatus === "running" ? "disabled" : ""}>
        本体 STL
      </button>
      <button class="secondary-card-button" type="button" data-export="legend" ${state.exportsStatus === "running" ? "disabled" : ""}>
        印字 STL
      </button>
      <button class="secondary-card-button" type="button" data-export="3mf" ${state.exportsStatus === "running" ? "disabled" : ""}>
        3MF PoC
      </button>
    </div>

    <div class="mini-code-block">
      <div class="mini-code-block__title">History</div>
      <pre>${escapeHtml(renderHistory())}</pre>
    </div>
  `;
}

function renderStatusCard(label, status, summary) {
  return `
    <article class="status-card">
      <span class="chip-label">${label}</span>
      <div class="status-row">
        <strong>${getStatusLabel(status)}</strong>
        <span class="status-dot status-dot--${getStatusTone(status)}"></span>
      </div>
      <p>${escapeHtml(summary)}</p>
    </article>
  `;
}

function renderFieldGroup(group) {
  return `
    <section class="field-group-card">
      <div class="field-group-header">
        <h3>${group.title}</h3>
        <p>${group.description}</p>
      </div>
      <div class="field-grid">
        ${group.fields.map((field) => renderField(field)).join("")}
      </div>
    </section>
  `;
}

function renderField(field) {
  const value = state.keycapParams[field.key];

  if (field.type === "checkbox") {
    return `
      <label class="field field--checkbox">
        <span class="field-copy">
          <span class="field-label">${field.label}</span>
          <span class="field-hint">${field.hint ?? ""}</span>
        </span>
        <span class="checkbox-pill">
          <input type="checkbox" data-field="${field.key}" ${value ? "checked" : ""} />
          <span>${value ? "ON" : "OFF"}</span>
        </span>
      </label>
    `;
  }

  if (field.type === "select") {
    return `
      <label class="field">
        <span class="field-copy">
          <span class="field-label">${field.label}</span>
          <span class="field-hint">${field.hint ?? ""}</span>
        </span>
        <span class="field-control field-control--select">
          <select data-field="${field.key}">
            ${field.options
              .map(
                (option) => `
                  <option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>
                `,
              )
              .join("")}
          </select>
        </span>
      </label>
    `;
  }

  return `
    <label class="field">
      <span class="field-copy">
        <span class="field-label">${field.label}</span>
        <span class="field-hint">${field.hint ?? ""}</span>
      </span>
      <span class="field-control">
        <input
          type="number"
          data-field="${field.key}"
          value="${value}"
          ${field.min != null ? `min="${field.min}"` : ""}
          ${field.max != null ? `max="${field.max}"` : ""}
          ${field.step != null ? `step="${field.step}"` : ""}
        />
        <span class="field-unit">${field.unit ?? ""}</span>
      </span>
    </label>
  `;
}

function handleSidebarTabChange(event) {
  state.sidebarTab = event.currentTarget.dataset.sidebarTab;
  render();
}

function handleViewportResize() {
  const nextMode = getViewportLayoutMode();
  if (nextMode !== viewportLayoutMode) {
    viewportLayoutMode = nextMode;
    render();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderHistory() {
  if (state.exportHistory.length === 0) {
    return "まだ生成履歴はありません。";
  }

  return state.exportHistory
    .map(
      (entry) =>
        `${entry.format.toUpperCase()} | ${entry.elapsedMs} ms | ${entry.byteLength} bytes | ${entry.notes}`,
    )
    .join("\n");
}

function createSampleFiles() {
  return [
    {
      path: samplePath,
      content: minimumPocScad,
    },
  ];
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function handleFieldChange(event) {
  const field = event.currentTarget.dataset.field;
  const input = event.currentTarget;

  if (input.type === "checkbox") {
    state.keycapParams[field] = input.checked;
  } else if (input.tagName === "SELECT") {
    state.keycapParams[field] = input.value;
  } else {
    state.keycapParams[field] = Number(input.value);
  }

  syncDerivedKeycapParams();

  state.editorStatus = "dirty";
  state.editorSummary = "入力変更待ち";
  schedulePreviewRefresh();
}

function schedulePreviewRefresh() {
  window.clearTimeout(previewDebounceTimer);
  previewDebounceTimer = window.setTimeout(() => {
    executeKeycapPreview({ silent: true });
  }, 450);
}

async function renderPreviewViewer() {
  const container = app.querySelector("[data-preview-stage]");
  if (!container) {
    return;
  }

  if (state.previewLayers.length === 0) {
    container.innerHTML = `
      <div class="preview-placeholder">
        まだ preview mesh がありません。パラメータを調整すると自動で OFF プレビューを更新します。
      </div>
    `;
    return;
  }

  previewSceneModulePromise ??= import("./lib/preview-scene.js");
  const { mountPreviewScene } = await previewSceneModulePromise;
  if (!container.isConnected || state.previewLayers.length === 0) {
    return;
  }

  disposePreviewScene = mountPreviewScene(container, state.previewLayers);
}

function createKeycapOffJobs(purpose) {
  if (purpose === "preview" || purpose === "3mf") {
    return [
      {
        name: "body",
        exportTarget: "body",
        outputPath: keycapBodyPreviewPath,
        color: previewLayerPalette.body,
      },
      ...(state.keycapParams.legendEnabled
        ? [
            {
              name: "legend",
              exportTarget: "legend",
              outputPath: keycapLegendPreviewPath,
              color: previewLayerPalette.legend,
            },
          ]
        : []),
    ];
  }

  throw new Error(`未対応の OFF ジョブ用途です: ${purpose}`);
}

async function runKeycapOffJobs(jobs) {
  const outputs = [];

  for (const job of jobs) {
    const result = await runOpenScad({
      files: createKeycapFiles({
        params: state.keycapParams,
        exportTarget: job.exportTarget,
      }),
      args: buildKeycapArgs({
        outputPath: job.outputPath,
        outputFormat: "off",
      }),
      outputPaths: [job.outputPath],
    });

    const [output] = result.outputs;
    outputs.push({
      ...job,
      result,
      mesh: parseOff(textDecoder.decode(output.bytes)),
    });
  }

  return outputs;
}

async function executeRuntimePoc() {
  state.runtimeStatus = "running";
  state.runtimeSummary = "OpenSCAD runtime を初期化しています";
  state.logs = [];
  state.error = "";
  render();

  try {
    const result = await runOpenScad({
      files: createSampleFiles(),
      args: [
        samplePath,
        "-o",
        previewOutputPath,
        "--backend=manifold",
        "--export-format=off",
      ],
      outputPaths: [previewOutputPath],
    });

    const [output] = result.outputs;
    state.runtimeStatus = "success";
    state.runtimeSummary = `${Math.round(result.elapsedMs)} ms / ${output?.bytes?.byteLength ?? 0} bytes`;
    state.logs = result.logs.map((entry) => `[${entry.stream}] ${entry.text}`);
    state.error = "最小 SCAD の OFF 出力に成功しました。";
  } catch (error) {
    state.runtimeStatus = "error";
    state.runtimeSummary = "PoC 実行失敗";
    state.logs = [];
    state.error = `${error}`;
  }

  render();
}

async function executeKeycapPreview(options = {}) {
  const { silent = false } = options;

  state.editorStatus = "running";
  state.editorSummary = "プレビュー用 OFF を生成しています";
  if (!silent) {
    state.editorLogs = [];
    state.editorError = "";
  }
  render();

  try {
    const previewResults = await runKeycapOffJobs(createKeycapOffJobs("preview"));
    const totalElapsedMs = previewResults.reduce((sum, entry) => sum + entry.result.elapsedMs, 0);
    const totalVertices = previewResults.reduce((sum, entry) => sum + entry.mesh.vertices.length, 0);
    const totalFaces = previewResults.reduce((sum, entry) => sum + entry.mesh.faces.length, 0);
    state.editorStatus = "success";
    state.editorSummary = `${Math.round(totalElapsedMs)} ms / ${previewResults.length} objects / ${totalVertices} vertices / ${totalFaces} triangles`;
    state.editorLogs = previewResults.flatMap((entry) =>
      entry.result.logs.map((log) => `[${entry.name}/${log.stream}] ${log.text}`),
    );
    state.editorError = "プレビュー用 OFF の生成に成功しました。body 側のホーミングバーと、別ボディの legend を分けて描画しています。";
    state.previewLayers = previewResults.map((entry) => ({
      name: entry.name,
      color: entry.color,
      mesh: entry.mesh,
    }));
  } catch (error) {
    state.editorStatus = "error";
    state.editorSummary = "プレビュー生成失敗";
    state.editorLogs = [];
    state.editorError = `${error}`;
    state.previewLayers = [];
  }

  render();
}

async function executeExport(format) {
  state.exportsStatus = "running";
  state.exportsSummary = `${format.toUpperCase()} を生成しています`;
  render();

  try {
    if (format === "body") {
      const result = await runOpenScad({
        files: createKeycapFiles({
          params: state.keycapParams,
          exportTarget: "body",
        }),
        args: buildKeycapArgs({
          outputPath: keycapBodyPath,
          outputFormat: "stl",
        }),
        outputPaths: [keycapBodyPath],
      });

      const [output] = result.outputs;
      downloadBlob(new Blob([output.bytes], { type: "model/stl" }), "keycap-body.stl");
      state.exportsStatus = "success";
      state.exportsSummary = `本体 STL を生成しました (${output.bytes.byteLength} bytes)`;
      state.exportHistory.unshift({
        format,
        elapsedMs: Math.round(result.elapsedMs),
        byteLength: output.bytes.byteLength,
        notes: "body volume を binary STL で出力",
      });
    } else if (format === "legend") {
      const result = await runOpenScad({
        files: createKeycapFiles({
          params: state.keycapParams,
          exportTarget: "legend",
        }),
        args: buildKeycapArgs({
          outputPath: keycapLegendPath,
          outputFormat: "stl",
        }),
        outputPaths: [keycapLegendPath],
      });

      const [output] = result.outputs;
      downloadBlob(new Blob([output.bytes], { type: "model/stl" }), "keycap-legend.stl");
      state.exportsStatus = "success";
      state.exportsSummary = `印字 STL を生成しました (${output.bytes.byteLength} bytes)`;
      state.exportHistory.unshift({
        format,
        elapsedMs: Math.round(result.elapsedMs),
        byteLength: output.bytes.byteLength,
        notes: "legend volume を binary STL で出力",
      });
    } else if (format === "3mf") {
      const offResults = await runKeycapOffJobs(createKeycapOffJobs("3mf"));
      const blob = create3mfBlob(
        offResults.map((entry) => ({
          name: `keycap-${entry.name}`,
          ...entry.mesh,
        })),
      );
      downloadBlob(blob, keycap3mfPath);

      state.exportsStatus = "success";
      state.exportsSummary = `3MF PoC を生成しました (${blob.size} bytes / ${offResults.length} objects)`;
      state.exportHistory.unshift({
        format,
        elapsedMs: Math.round(offResults.reduce((sum, entry) => sum + entry.result.elapsedMs, 0)),
        byteLength: blob.size,
        notes: "body / legend を別オブジェクトの 3MF として出力",
      });
    } else {
      throw new Error(`未対応の export 形式です: ${format}`);
    }
  } catch (error) {
    state.exportsStatus = "error";
    state.exportsSummary = `${format.toUpperCase()} の生成に失敗しました`;
    state.exportHistory.unshift({
      format,
      elapsedMs: 0,
      byteLength: 0,
      notes: `${error}`,
    });
  }

  render();
}

render();

window.addEventListener("resize", handleViewportResize);

const params = new URLSearchParams(window.location.search);
if (params.get("autorun") === "1") {
  executeRuntimePoc();
}

executeKeycapPreview({ silent: true });
