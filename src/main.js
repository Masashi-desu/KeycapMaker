import "./styles.css";
import minimumPocScad from "../scad/samples/minimum-poc.scad?raw";
import { runOpenScad } from "./lib/openscad-client.js";
import { create3mfBlob } from "./lib/export-3mf.js";
import { parseOff } from "./lib/off-parser.js";
import {
  DEFAULT_KEYCAP_LEGEND_FONT_KEY,
  KEYCAP_LEGEND_FONTS,
  buildKeycapArgs,
  createKeycapFiles,
} from "./lib/keycap-scad-bundle.js";

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
const KEY_UNIT_MM = 18;
const SHAPE_PROFILE_OPTIONS = [
  { value: "standard-1u", label: "標準 1u" },
];
const DEFAULT_SHAPE_PROFILE_KEY = SHAPE_PROFILE_OPTIONS[0].value;

const workspaceSections = [
  {
    id: "params",
    label: "設定",
  },
  {
    id: "guide",
    label: "使い方",
  },
  {
    id: "export",
    label: "書き出し",
  },
];

const fieldGroups = [
  {
    id: "shape",
    title: "キーキャップの形",
    description: "キーキャップ全体の大きさと、上に向かって細くなる具合を調整します。キーサイズは横幅と連動していて、18 mm を 1u として換算します。",
    fields: [
      {
        key: "shapeProfile",
        label: "形のベース",
        hint: "使う基本形を選びます。現在は標準 1u のみ選べます",
        type: "select",
        options: SHAPE_PROFILE_OPTIONS,
      },
      {
        key: "keyWidth",
        label: "横幅",
        hint: "横幅とキーサイズは連動します。18 mm = 1u です",
        type: "linked-size",
        unit: "mm",
        step: 0.1,
        min: 10,
        secondaryLabel: "キーサイズ",
        secondaryField: "keySizeUnits",
        secondaryUnit: "u",
        secondaryStep: 0.05,
        secondaryMin: 0.5,
      },
      { key: "keyDepth", label: "奥行き", hint: "キーキャップの前後の大きさです", unit: "mm", step: 0.1, min: 10 },
      { key: "bodyHeight", label: "全体の高さ", hint: "いちばん高い位置までの高さです", unit: "mm", step: 0.1, min: 1 },
      { key: "wallThickness", label: "厚み", hint: "キーキャップの丈夫さに関わる厚みです", unit: "mm", step: 0.05, min: 0.4 },
      { key: "topScale", label: "上面のすぼまり", hint: "数字を小さくすると上面が細く見えます", unit: "", step: 0.01, min: 0.5, max: 1 },
    ],
  },
  {
    title: "印字",
    description: "入れる文字、書体、見た目、位置、盛り上がりをまとめて調整します。複数文字もそのまま入力できます。",
    fields: [
      { key: "legendEnabled", label: "印字を入れる", hint: "オフにすると文字を作りません", type: "checkbox" },
      {
        key: "legendText",
        label: "入れる文字",
        hint: "複数文字をそのまま入力できます",
        type: "text",
        maxLength: 24,
        placeholder: "A / Shift / あ",
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendFontKey",
        label: "書体",
        hint: "配信に同梱できるライセンスの書体だけを表示しています",
        type: "select",
        options: KEYCAP_LEGEND_FONTS.map((font) => ({ value: font.key, label: font.label })),
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendWeight",
        label: "文字の太さ",
        hint: "見えやすくしたいときは太字にできます",
        type: "select",
        options: [
          { value: "regular", label: "標準" },
          { value: "bold", label: "太字" },
        ],
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendSlant",
        label: "文字の傾き",
        hint: "少し傾けて見た目の印象を変えられます",
        type: "select",
        options: [
          { value: "none", label: "なし" },
          { value: "italic", label: "イタリック風" },
          { value: "slanted", label: "ななめ" },
        ],
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendUnderlineEnabled",
        label: "下線を付ける",
        hint: "文字の下に線を追加します",
        type: "checkbox",
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendWidth",
        label: "文字の横幅の目安",
        hint: "文字が左右に広がる範囲です",
        unit: "mm",
        step: 0.1,
        min: 0.5,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendDepth",
        label: "文字の縦幅の目安",
        hint: "文字が前後に広がる範囲です",
        unit: "mm",
        step: 0.1,
        min: 0.5,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendHeight",
        label: "文字の高さ",
        hint: "0 にすると表面と同じ高さに収まり、数字を上げると盛り上がります",
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendOffsetX",
        label: "左右の位置",
        hint: "文字を左右に動かします",
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendOffsetY",
        label: "前後の位置",
        hint: "文字を前後に動かします",
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.legendEnabled,
      },
    ],
  },
  {
    title: "指の目印",
    description: "F キーや J キーのように、指で触って分かる出っ張りを調整します。印字とは別に設定できます。",
    fields: [
      { key: "homingBarEnabled", label: "目印を付ける", hint: "指で位置を探しやすくします", type: "checkbox" },
      {
        key: "homingBarLength",
        label: "目印の長さ",
        hint: "左右にどれくらい広げるかです",
        unit: "mm",
        step: 0.1,
        min: 0.5,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarWidth",
        label: "目印の太さ",
        hint: "目印の見た目の太さです",
        unit: "mm",
        step: 0.05,
        min: 0.1,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarHeight",
        label: "目印の高さ",
        hint: "表面からどれだけ出すかです",
        unit: "mm",
        step: 0.05,
        min: 0.05,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarOffsetY",
        label: "目印の前後位置",
        hint: "目印を前後に動かします",
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarBaseThickness",
        label: "目印の土台の厚み",
        hint: "目印の根元の厚みです",
        unit: "mm",
        step: 0.05,
        min: 0.05,
        visibleWhen: (params) => params.homingBarEnabled,
      },
    ],
  },
  {
    title: "取り付け部分",
    description: "スイッチにはめる部分の大きさを調整します。今は Choc v2 に対応しています。",
    fields: [
      {
        key: "stemType",
        label: "取り付け方式",
        hint: "現在は Choc v2 のみ選べます",
        type: "select",
        options: [
          { value: "none", label: "なし" },
          { value: "choc_v2", label: "Choc v2" },
        ],
      },
      { key: "stemWidth", label: "取り付け部の幅", hint: "左右の基準サイズです", unit: "mm", step: 0.1, min: 0.5 },
      { key: "stemDepth", label: "取り付け部の奥行き", hint: "前後の基準サイズです", unit: "mm", step: 0.1, min: 0.5 },
      { key: "stemHeight", label: "取り付け部の高さ", hint: "どれだけ深く差し込むかです", unit: "mm", step: 0.1, min: 0.1 },
      { key: "stemInset", label: "底面からの開始位置", hint: "取り付け部が始まる位置です", unit: "mm", step: 0.1, min: 0.1 },
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
    shapeProfile: DEFAULT_SHAPE_PROFILE_KEY,
    keyWidth: 18,
    keyDepth: 18,
    bodyHeight: 9.5,
    wallThickness: 1.2,
    topScale: 0.84,
    legendEnabled: true,
    legendText: "A",
    legendFontKey: DEFAULT_KEYCAP_LEGEND_FONT_KEY,
    legendWeight: "regular",
    legendSlant: "none",
    legendUnderlineEnabled: false,
    legendWidth: 7.2,
    legendDepth: 4.0,
    legendHeight: 0,
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

function formatUnitInputValue(value = state.keycapParams.keyWidth) {
  return (Number(value) / KEY_UNIT_MM).toFixed(2);
}

function formatColorHex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function isLegendTextSet(value = state.keycapParams.legendText) {
  return String(value ?? "").trim().length > 0;
}

function isLegendRenderable() {
  return state.keycapParams.legendEnabled && isLegendTextSet();
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
      <h1 class="panel-title">設定</h1>
      <p class="panel-text">選んだキーキャップの形や印字を、入力に合わせて右側へ自動反映しながら調整できます。</p>
    </div>

    <div class="parameter-group-list">
      ${fieldGroups.map((group) => renderFieldGroup(group)).join("")}
    </div>
  `;
}

function renderGuideTab() {
  return `
    <div class="panel-intro">
      <h1 class="panel-title">使い方</h1>
      <p class="panel-text">設定を変えたあと、右側の見た目を見ながら仕上がりを確認できます。</p>
    </div>

    <ol class="guide-list">
      <li class="guide-step">
        <strong>1. 左側で形や印字を決める</strong>
        <span>大きさ、文字、取り付け部分などを変えると、見た目が自動で更新されます。</span>
      </li>
      <li class="guide-step">
        <strong>2. 右側で仕上がりを見る</strong>
        <span>本体と印字を分けて表示し、カーソルを乗せたときだけ回転や拡大ができます。</span>
      </li>
      <li class="guide-step">
        <strong>3. 動作チェックをする</strong>
        <span>簡易チェックを実行すると、ブラウザ内の生成機能が動いているかを確認できます。</span>
      </li>
    </ol>

    ${renderStatusCard("動作チェック", state.runtimeStatus, state.runtimeSummary)}

    <button class="secondary-card-button" type="button" data-run-poc ${state.runtimeStatus === "running" ? "disabled" : ""}>
      ${state.runtimeStatus === "running" ? "確認中..." : "簡易チェックを実行する"}
    </button>

    <div class="mini-code-block">
      <div class="mini-code-block__title">処理ログ</div>
      <pre>${state.logs.length > 0 ? escapeHtml(state.logs.join("\n")) : "ログはまだありません。"}</pre>
    </div>

    <p class="feedback-text">${state.error ? escapeHtml(state.error) : "まだエラーはありません。"}</p>
  `;
}

function renderExportTab() {
  return `
    <div class="panel-intro">
      <h1 class="panel-title">書き出し</h1>
      <p class="panel-text">印刷用のデータを保存します。印字がある場合は、本体と印字を分けたまま書き出せます。</p>
    </div>

    ${renderStatusCard("保存状況", state.exportsStatus, state.exportsSummary)}

    <div class="export-button-list">
      <button class="secondary-card-button" type="button" data-export="body" ${state.exportsStatus === "running" ? "disabled" : ""}>
        本体を保存する
      </button>
      <button class="secondary-card-button" type="button" data-export="legend" ${state.exportsStatus === "running" || !isLegendRenderable() ? "disabled" : ""}>
        印字を保存する
      </button>
      <button class="secondary-card-button" type="button" data-export="3mf" ${state.exportsStatus === "running" ? "disabled" : ""}>
        まとめて保存する
      </button>
    </div>

    <div class="mini-code-block">
      <div class="mini-code-block__title">保存履歴</div>
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
  const visibleFields = group.fields.filter((field) => isFieldVisible(field));

  return `
    <section class="field-group-card">
      <div class="field-group-header">
        <h3>${group.title}</h3>
        <p>${group.description}</p>
      </div>
      <div class="field-grid">
        ${visibleFields.map((field) => renderField(field)).join("")}
      </div>
    </section>
  `;
}

function isFieldVisible(field) {
  if (typeof field.visibleWhen !== "function") {
    return true;
  }

  return field.visibleWhen(state.keycapParams);
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
          <span>${value ? "オン" : "オフ"}</span>
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

  if (field.type === "text") {
    return `
      <label class="field">
        <span class="field-copy">
          <span class="field-label">${field.label}</span>
          <span class="field-hint">${field.hint ?? ""}</span>
        </span>
        <span class="field-control">
          <input
            type="text"
            data-field="${field.key}"
            value="${escapeHtml(value)}"
            ${field.maxLength != null ? `maxlength="${field.maxLength}"` : ""}
            ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""}
          />
        </span>
      </label>
    `;
  }

  if (field.type === "linked-size") {
    return `
      <label class="field field--linked-size">
        <span class="field-copy">
          <span class="field-label">${field.label}</span>
          <span class="field-hint">${field.hint ?? ""}</span>
        </span>
        <span class="field-control-cluster">
          <span class="field-mini-control">
            <span class="field-mini-control__label">横幅</span>
            <span class="field-control">
              <input
                type="number"
                data-field="${field.key}"
                value="${value}"
                ${field.min != null ? `min="${field.min}"` : ""}
                ${field.max != null ? `max="${field.max}"` : ""}
                ${field.step != null ? `step="${field.step}"` : ""}
              />
              ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
            </span>
          </span>
          <span class="field-mini-control">
            <span class="field-mini-control__label">${field.secondaryLabel}</span>
            <span class="field-control">
              <input
                type="number"
                data-field="${field.secondaryField}"
                value="${formatUnitInputValue(value)}"
                ${field.secondaryMin != null ? `min="${field.secondaryMin}"` : ""}
                ${field.secondaryStep != null ? `step="${field.secondaryStep}"` : ""}
              />
              ${field.secondaryUnit ? `<span class="field-unit">${field.secondaryUnit}</span>` : ""}
            </span>
          </span>
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
        ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
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
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHistory() {
  if (state.exportHistory.length === 0) {
    return "まだ生成履歴はありません。";
  }

  return state.exportHistory
    .map(
      (entry) =>
        `${entry.label} | ${entry.elapsedMs} ms | ${entry.byteLength} bytes | ${entry.notes}`,
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

  if (field === "keySizeUnits") {
    state.keycapParams.keyWidth = Number(input.value) * KEY_UNIT_MM;
    syncLinkedShapeInputs("keySizeUnits");
  } else if (input.type === "checkbox") {
    state.keycapParams[field] = input.checked;
  } else if (input.tagName === "SELECT") {
    state.keycapParams[field] = input.value;
  } else if (input.type === "text") {
    state.keycapParams[field] = input.value;
  } else {
    state.keycapParams[field] = Number(input.value);
    if (field === "keyWidth") {
      syncLinkedShapeInputs("keyWidth");
    }
  }

  syncDerivedKeycapParams();

  state.editorStatus = "dirty";
  state.editorSummary = "入力内容を反映待ち";
  schedulePreviewRefresh();
}

function syncLinkedShapeInputs(changedField) {
  const widthInput = app.querySelector('[data-field="keyWidth"]');
  const sizeInput = app.querySelector('[data-field="keySizeUnits"]');

  if (changedField === "keySizeUnits" && widthInput) {
    widthInput.value = `${state.keycapParams.keyWidth}`;
  }

  if (changedField === "keyWidth" && sizeInput) {
    sizeInput.value = formatUnitInputValue(state.keycapParams.keyWidth);
  }
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
        まだ見た目を表示していません。設定を変えると自動で最新の形に更新されます。
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
      ...(isLegendRenderable()
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
      files: await createKeycapFiles({
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
  state.runtimeSummary = "生成機能の準備をしています";
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
    state.error = "簡易チェックが正常に完了しました。";
  } catch (error) {
    state.runtimeStatus = "error";
    state.runtimeSummary = "簡易チェックに失敗しました";
    state.logs = [];
    state.error = `${error}`;
  }

  render();
}

async function executeKeycapPreview(options = {}) {
  const { silent = false } = options;

  state.editorStatus = "running";
  state.editorSummary = "見た目を更新しています";
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
    state.editorError = isLegendRenderable()
      ? "見た目の更新が完了しました。キーキャップ本体と印字を分けて表示しています。"
      : "見た目の更新が完了しました。印字は入っていないため、本体だけを表示しています。";
    state.previewLayers = previewResults.map((entry) => ({
      name: entry.name,
      color: entry.color,
      mesh: entry.mesh,
    }));
  } catch (error) {
    state.editorStatus = "error";
    state.editorSummary = "見た目の更新に失敗しました";
    state.editorLogs = [];
    state.editorError = `${error}`;
    state.previewLayers = [];
  }

  render();
}

async function executeExport(format) {
  if (format === "legend" && !isLegendRenderable()) {
    state.exportsStatus = "error";
    state.exportsSummary = "印字が入っていないため、印字データは保存できません";
    render();
    return;
  }

  state.exportsStatus = "running";
  state.exportsSummary = "保存データを準備しています";
  render();

  try {
    if (format === "body") {
      const result = await runOpenScad({
        files: await createKeycapFiles({
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
      state.exportsSummary = `本体データを保存しました (${output.bytes.byteLength} bytes)`;
      state.exportHistory.unshift({
        format,
        label: "本体データ",
        elapsedMs: Math.round(result.elapsedMs),
        byteLength: output.bytes.byteLength,
        notes: "3D プリンタ向けの STL 形式で保存",
      });
    } else if (format === "legend") {
      const result = await runOpenScad({
        files: await createKeycapFiles({
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
      state.exportsSummary = `印字データを保存しました (${output.bytes.byteLength} bytes)`;
      state.exportHistory.unshift({
        format,
        label: "印字データ",
        elapsedMs: Math.round(result.elapsedMs),
        byteLength: output.bytes.byteLength,
        notes: "印字だけを STL 形式で保存",
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
      state.exportsSummary = `まとめて保存しました (${blob.size} bytes / ${offResults.length} 個のパーツ)`;
      state.exportHistory.unshift({
        format,
        label: "まとめて保存",
        elapsedMs: Math.round(offResults.reduce((sum, entry) => sum + entry.result.elapsedMs, 0)),
        byteLength: blob.size,
        notes: "本体と印字を 3MF 形式でまとめて保存",
      });
    } else {
      throw new Error(`未対応の export 形式です: ${format}`);
    }
  } catch (error) {
    state.exportsStatus = "error";
    state.exportsSummary = "保存に失敗しました";
    state.exportHistory.unshift({
      format,
      label: "保存失敗",
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
