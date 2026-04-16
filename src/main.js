import "./styles.css";
import minimumPocScad from "../scad/samples/minimum-poc.scad?raw";
import { runOpenScad } from "./lib/openscad-client.js";
import { create3mfBlob } from "./lib/export-3mf.js";
import { parseOff } from "./lib/off-parser.js";
import { buildKeycapArgs, createKeycapFiles } from "./lib/keycap-scad-bundle.js";

const app = document.querySelector("#app");
const samplePath = "/samples/minimum-poc.scad";
const previewOutputPath = "/outputs/minimum-poc.off";
const stlOutputPath = "/outputs/minimum-poc.stl";
const keycapPreviewPath = "/outputs/keycap-preview.off";
const keycapBodyPath = "/outputs/keycap-body.stl";
const keycapLegendPath = "/outputs/keycap-legend.stl";
const keycap3mfPath = "keycap-preview.3mf";
const sampleName = "minimum-poc";

const fieldGroups = [
  {
    title: "本体",
    fields: [
      { key: "keyWidth", label: "幅", step: 0.1, min: 10 },
      { key: "keyDepth", label: "奥行き", step: 0.1, min: 10 },
      { key: "bodyHeight", label: "高さ", step: 0.1, min: 1 },
      { key: "wallThickness", label: "肉厚", step: 0.05, min: 0.4 },
      { key: "topScale", label: "上面スケール", step: 0.01, min: 0.5, max: 1 },
    ],
  },
  {
    title: "印字",
    fields: [
      { key: "legendEnabled", label: "印字を有効化", type: "checkbox" },
      { key: "legendWidth", label: "印字幅", step: 0.1, min: 0.5 },
      { key: "legendDepth", label: "印字奥行き", step: 0.1, min: 0.5 },
      { key: "legendHeight", label: "印字高さ", step: 0.05, min: 0.1 },
      { key: "legendOffsetX", label: "印字 X オフセット", step: 0.1 },
      { key: "legendOffsetY", label: "印字 Y オフセット", step: 0.1 },
    ],
  },
  {
    title: "Stem",
    fields: [
      { key: "stemEnabled", label: "Stem cavity を有効化", type: "checkbox" },
      { key: "stemWidth", label: "Stem 幅", step: 0.1, min: 0.5 },
      { key: "stemDepth", label: "Stem 奥行き", step: 0.1, min: 0.5 },
      { key: "stemHeight", label: "Stem 高さ", step: 0.1, min: 0.1 },
      { key: "stemInset", label: "Stem inset", step: 0.1, min: 0.1 },
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
  keycapParams: {
    keyWidth: 18,
    keyDepth: 18,
    bodyHeight: 7.4,
    wallThickness: 1.15,
    topScale: 0.84,
    legendEnabled: true,
    legendWidth: 7.2,
    legendDepth: 4.0,
    legendHeight: 0.8,
    legendOffsetX: 0,
    legendOffsetY: 0,
    stemEnabled: true,
    stemWidth: 6.2,
    stemDepth: 6.2,
    stemHeight: 3.4,
    stemInset: 1.1,
  },
};

if (!app) {
  throw new Error("#app が見つかりません。");
}

function render() {
  app.innerHTML = `
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Keycaps Maker</p>
        <h1>キーキャップ編集 Web アプリの実装基盤</h1>
        <p class="lead">
          GitHub Pages 配信を前提に、OpenSCAD 系ランタイムのブラウザ実行、
          キーキャップ形状のプレビュー、STL / 3MF の PoC を段階的に追加します。
        </p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>現在の状態</h2>
          <ul>
            <li>Task 01: Vite ベースの静的アプリ初期化</li>
            <li>Task 02: OpenSCAD WASM ランタイム同梱済み</li>
            <li>Task 03-04: STL / 3MF PoC 実装済み</li>
            <li>Task 07-08: キーキャップ SCAD ベースと入力 UI を実装中</li>
          </ul>
        </article>

        <article class="card">
          <h2>次に行うこと</h2>
          <ul>
            <li>Three.js を使ったプレビュー表示</li>
            <li>本体 / 印字の別体積 export を可視化</li>
            <li>GitHub Pages ワークフロー整備と運用文書の仕上げ</li>
          </ul>
        </article>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Task 02</p>
            <h2>OpenSCAD ブラウザ実行 PoC</h2>
          </div>
          <button class="action-button" data-run-poc ${state.runtimeStatus === "running" ? "disabled" : ""}>
            ${state.runtimeStatus === "running" ? "実行中..." : "最小 SCAD を実行"}
          </button>
        </div>

        <div class="stats">
          <div class="stat">
            <span class="stat-label">状態</span>
            <strong>${state.runtimeStatus}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">概要</span>
            <strong>${state.runtimeSummary}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">入力</span>
            <strong>${samplePath}</strong>
          </div>
        </div>

        <div class="code-block">
          <div class="code-block-header">minimum-poc.scad</div>
          <pre>${escapeHtml(minimumPocScad)}</pre>
        </div>

        <div class="log-grid">
          <div class="code-block">
            <div class="code-block-header">実行ログ</div>
            <pre>${state.logs.length > 0 ? escapeHtml(state.logs.join("\n")) : "ログはまだありません。"}</pre>
          </div>
          <div class="code-block">
            <div class="code-block-header">エラー / 備考</div>
            <pre>${state.error ? escapeHtml(state.error) : "まだエラーはありません。"}</pre>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Task 08</p>
            <h2>キーキャップ用パラメータ編集 UI</h2>
          </div>
          <button class="action-button" data-preview-keycap ${state.editorStatus === "running" ? "disabled" : ""}>
            ${state.editorStatus === "running" ? "更新中..." : "プレビュー用 OFF を生成"}
          </button>
        </div>

        <div class="editor-grid">
          ${fieldGroups
            .map(
              (group) => `
                <section class="form-card">
                  <h3>${group.title}</h3>
                  <div class="field-grid">
                    ${group.fields.map((field) => renderField(field)).join("")}
                  </div>
                </section>
              `,
            )
            .join("")}
        </div>

        <div class="stats">
          <div class="stat">
            <span class="stat-label">状態</span>
            <strong>${state.editorStatus}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">概要</span>
            <strong>${state.editorSummary}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">出力対象</span>
            <strong>preview / body / legend を分離可能</strong>
          </div>
        </div>

        <div class="log-grid">
          <div class="code-block">
            <div class="code-block-header">エディタログ</div>
            <pre>${state.editorLogs.length > 0 ? escapeHtml(state.editorLogs.join("\n")) : "まだプレビュー生成を実行していません。"}</pre>
          </div>
          <div class="code-block">
            <div class="code-block-header">エラー / 備考</div>
            <pre>${state.editorError ? escapeHtml(state.editorError) : "まだエラーはありません。"}</pre>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="section-label">Task 03 / Task 04</p>
            <h2>STL / 3MF 出力 PoC</h2>
          </div>
          <div class="button-row">
            <button class="secondary-button" data-export="body" ${state.exportsStatus === "running" ? "disabled" : ""}>
              本体 STL
            </button>
            <button class="secondary-button" data-export="legend" ${state.exportsStatus === "running" ? "disabled" : ""}>
              印字 STL
            </button>
            <button class="secondary-button" data-export="3mf" ${state.exportsStatus === "running" ? "disabled" : ""}>
              3MF PoC
            </button>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <span class="stat-label">状態</span>
            <strong>${state.exportsStatus}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">概要</span>
            <strong>${state.exportsSummary}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">方針</span>
            <strong>body / legend 分離を優先、3MF は PoC</strong>
          </div>
        </div>

        <div class="code-block">
          <div class="code-block-header">生成履歴</div>
          <pre>${escapeHtml(renderHistory())}</pre>
        </div>
      </section>
    </main>
  `;

  app.querySelector("[data-run-poc]")?.addEventListener("click", executeRuntimePoc);
  app.querySelector("[data-preview-keycap]")?.addEventListener("click", executeKeycapPreview);
  app.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => executeExport(button.dataset.export));
  });
  app.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", handleFieldChange);
    input.addEventListener("change", handleFieldChange);
  });
}

function renderField(field) {
  const value = state.keycapParams[field.key];

  if (field.type === "checkbox") {
    return `
      <label class="field checkbox-field">
        <input type="checkbox" data-field="${field.key}" ${value ? "checked" : ""} />
        <span>${field.label}</span>
      </label>
    `;
  }

  return `
    <label class="field">
      <span>${field.label}</span>
      <input
        type="number"
        data-field="${field.key}"
        value="${value}"
        ${field.min != null ? `min="${field.min}"` : ""}
        ${field.max != null ? `max="${field.max}"` : ""}
        ${field.step != null ? `step="${field.step}"` : ""}
      />
    </label>
  `;
}

function escapeHtml(value) {
  return value
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
  } else {
    state.keycapParams[field] = Number(input.value);
  }
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

async function executeKeycapPreview() {
  state.editorStatus = "running";
  state.editorSummary = "プレビュー用 OFF を生成しています";
  state.editorLogs = [];
  state.editorError = "";
  render();

  try {
    const result = await runOpenScad({
      files: createKeycapFiles(),
      args: buildKeycapArgs({
        params: state.keycapParams,
        exportTarget: "preview",
        outputPath: keycapPreviewPath,
        outputFormat: "off",
      }),
      outputPaths: [keycapPreviewPath],
    });

    const [output] = result.outputs;
    state.editorStatus = "success";
    state.editorSummary = `${Math.round(result.elapsedMs)} ms / ${output.bytes.byteLength} bytes`;
    state.editorLogs = result.logs.map((entry) => `[${entry.stream}] ${entry.text}`);
    state.editorError = "プレビュー用 OFF の生成に成功しました。";
  } catch (error) {
    state.editorStatus = "error";
    state.editorSummary = "プレビュー生成失敗";
    state.editorLogs = [];
    state.editorError = `${error}`;
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
        files: createKeycapFiles(),
        args: buildKeycapArgs({
          params: state.keycapParams,
          exportTarget: "body",
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
        files: createKeycapFiles(),
        args: buildKeycapArgs({
          params: state.keycapParams,
          exportTarget: "legend",
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
      const offResult = await runOpenScad({
        files: createKeycapFiles(),
        args: buildKeycapArgs({
          params: state.keycapParams,
          exportTarget: "preview",
          outputPath: keycapPreviewPath,
          outputFormat: "off",
        }),
        outputPaths: [keycapPreviewPath],
      });

      const [offOutput] = offResult.outputs;
      const mesh = parseOff(new TextDecoder().decode(offOutput.bytes));
      const blob = create3mfBlob([{ name: "keycap-preview", ...mesh }]);
      downloadBlob(blob, keycap3mfPath);

      state.exportsStatus = "success";
      state.exportsSummary = `3MF PoC を生成しました (${blob.size} bytes)`;
      state.exportHistory.unshift({
        format,
        elapsedMs: Math.round(offResult.elapsedMs),
        byteLength: blob.size,
        notes: "preview mesh を OFF -> 3MF へ変換",
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

const params = new URLSearchParams(window.location.search);
if (params.get("autorun") === "1") {
  executeRuntimePoc();
}
