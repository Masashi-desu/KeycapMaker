import "./styles.css";
import minimumPocScad from "../scad/samples/minimum-poc.scad?raw";
import { runOpenScad } from "./lib/openscad-client.js";
import { create3mfBlob } from "./lib/export-3mf.js";
import { parseOff } from "./lib/off-parser.js";

const app = document.querySelector("#app");
const samplePath = "/samples/minimum-poc.scad";
const previewOutputPath = "/outputs/minimum-poc.off";
const stlOutputPath = "/outputs/minimum-poc.stl";
const sampleName = "minimum-poc";

const state = {
  runtimeStatus: "idle",
  runtimeSummary: "未実行",
  logs: [],
  error: "",
  exportsStatus: "idle",
  exportsSummary: "未生成",
  exportHistory: [],
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
            <li>Task 02: OpenSCAD WASM ランタイムの PoC 実装中</li>
          </ul>
        </article>

        <article class="card">
          <h2>次に行うこと</h2>
          <ul>
            <li>最小 SCAD をブラウザ内で評価する</li>
            <li>OFF / STL / 3MF へ出力する導線を追加する</li>
            <li>キーキャップ専用パラメータ UI へ広げる</li>
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
            <p class="section-label">Task 03 / Task 04</p>
            <h2>STL / 3MF 出力 PoC</h2>
          </div>
          <div class="button-row">
            <button class="secondary-button" data-export="stl" ${state.exportsStatus === "running" ? "disabled" : ""}>
              STL を生成
            </button>
            <button class="secondary-button" data-export="3mf" ${state.exportsStatus === "running" ? "disabled" : ""}>
              3MF を生成
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
            <strong>STL 直接出力 / 3MF は OFF から生成</strong>
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
  app.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => executeExport(button.dataset.export));
  });
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

async function executeExport(format) {
  state.exportsStatus = "running";
  state.exportsSummary = `${format.toUpperCase()} を生成しています`;
  render();

  try {
    if (format === "stl") {
      const result = await runOpenScad({
        files: createSampleFiles(),
        args: [
          samplePath,
          "-o",
          stlOutputPath,
          "--backend=manifold",
          "--export-format=binstl",
        ],
        outputPaths: [stlOutputPath],
      });

      const [output] = result.outputs;
      const blob = new Blob([output.bytes], { type: "model/stl" });
      downloadBlob(blob, `${sampleName}.stl`);

      state.exportsStatus = "success";
      state.exportsSummary = `STL を生成しました (${output.bytes.byteLength} bytes)`;
      state.exportHistory.unshift({
        format,
        elapsedMs: Math.round(result.elapsedMs),
        byteLength: output.bytes.byteLength,
        notes: "OpenSCAD から binary STL を直接出力",
      });
    } else if (format === "3mf") {
      const offResult = await runOpenScad({
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

      const [offOutput] = offResult.outputs;
      const mesh = parseOff(new TextDecoder().decode(offOutput.bytes));
      const blob = create3mfBlob([
        {
          name: sampleName,
          ...mesh,
        },
      ]);
      downloadBlob(blob, `${sampleName}.3mf`);

      state.exportsStatus = "success";
      state.exportsSummary = `3MF を生成しました (${blob.size} bytes)`;
      state.exportHistory.unshift({
        format,
        elapsedMs: Math.round(offResult.elapsedMs),
        byteLength: blob.size,
        notes: "OFF メッシュをブラウザ側で 3MF パッケージ化",
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
