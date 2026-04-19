import "./styles.css";
import minimumPocScad from "../scad/samples/minimum-poc.scad?raw";
import keycapEditorProfiles from "./data/keycap-editor-profiles.json";
import { runOpenScad } from "./lib/openscad-client.js";
import { hexColorToNumber, normalizeHexColor } from "./lib/color-utils.js";
import { create3mfBlob } from "./lib/export-3mf.js";
import { parseOff } from "./lib/off-parser.js";
import {
  KEYCAP_LEGEND_FONTS,
  buildKeycapArgs,
  createKeycapFiles,
} from "./lib/keycap-scad-bundle.js";

const app = document.querySelector("#app");
const samplePath = "/samples/minimum-poc.scad";
const previewOutputPath = "/outputs/minimum-poc.off";
const keycapBodyPreviewPath = "/outputs/keycap-body-preview.off";
const keycapHomingPreviewPath = "/outputs/keycap-homing-preview.off";
const keycapLegendPreviewPath = "/outputs/keycap-legend-preview.off";
const keycap3mfPath = "keycap-preview.3mf";
const EDITOR_DATA_KIND = "keycaps-maker/editor-params";
const EDITOR_DATA_SCHEMA_VERSION = 1;
const CHEVRON_ICON_URLS = Object.freeze({
  expanded: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/chevron-up.svg",
  collapsed: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/chevron-down.svg",
});
let disposePreviewScene = null;
let previewDebounceTimer = 0;
let previewSceneModulePromise = null;
let colorisLoadPromise = null;
let latestPreviewRequestId = 0;
let previewViewState = null;
let viewportLayoutMode = getViewportLayoutMode();
let hasAttachedEditorDataDropListeners = false;
let editorDataDragDepth = 0;
const textDecoder = new TextDecoder();
const supportsUiViewTransitions = typeof document.startViewTransition === "function";
const reduceMotionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
const KEY_UNIT_MM = 18;
const COLORIS_STYLE_PATH = "vendor/coloris/coloris.min.css";
const COLORIS_SCRIPT_PATH = "vendor/coloris/coloris.min.js";
const DEFAULT_KEYCAP_COLORS = Object.freeze({
  bodyColor: "#f8f9fa",
  legendColor: "#212529",
  homingBarColor: "#ff7f00",
});
const COLORIS_SWATCHES = Object.freeze([
  DEFAULT_KEYCAP_COLORS.bodyColor,
  DEFAULT_KEYCAP_COLORS.legendColor,
  DEFAULT_KEYCAP_COLORS.homingBarColor,
  "#f7efe2",
  "#d8ccb8",
  "#2d241c",
  "#6f5e4d",
  "#7b9bbf",
  "#5d9270",
  "#b8884c",
]);
const SHAPE_PROFILE_OPTIONS = keycapEditorProfiles.profiles.map((profile) => ({
  value: profile.key,
  label: profile.label,
}));
const DEFAULT_SHAPE_PROFILE_KEY = keycapEditorProfiles.defaultProfileKey ?? SHAPE_PROFILE_OPTIONS[0]?.value ?? "standard-1u";
const EDITOR_SELECTOR_KEYS = Object.freeze(keycapEditorProfiles.selectorKeys ?? ["shapeProfile", "legendFontKey", "stemType"]);
const keycapProfileByKey = new Map(keycapEditorProfiles.profiles.map((profile) => [profile.key, profile]));

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

function cloneSerializable(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function resolveShapeProfileConfig(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return keycapProfileByKey.get(profileKey) ?? keycapProfileByKey.get(DEFAULT_SHAPE_PROFILE_KEY);
}

function createDefaultKeycapParams(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const profile = resolveShapeProfileConfig(profileKey);
  return cloneSerializable(profile?.defaults ?? {});
}

const fieldGroups = [
  {
    id: "shape",
    title: "キーキャップの形",
    description: "キーキャップ全体の大きさと、上に向かって細くなる具合を調整します。キーサイズは横幅と連動していて、18 mm を 1u として換算します。",
    fields: [
      {
        key: "shapeProfile",
        label: "形のベース",
        hint: "使う基本形を選びます",
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
      {
        key: "bodyColor",
        label: "本体の色",
        hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.bodyColor,
      },
    ],
  },
  {
    id: "legend",
    title: "印字",
    description: "入れる文字、書体、見た目、位置、盛り上がり、埋め込み量をまとめて調整します。複数文字もそのまま入力できます。",
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
        hint: "0 にすると上面シェルの大半を埋める埋め込み印字になり、数字を上げると盛り上がります",
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendEmbed",
        label: "内側への埋め込み",
        hint: "盛り上がる文字の根元をどれだけキートップ内部へ入れるかです。高さ 0 の場合は上面シェルの大半まで自動で埋め込みます",
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendColor",
        label: "印字の色",
        hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.legendColor,
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
    id: "homing",
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
      {
        key: "homingBarColor",
        label: "目印の色",
        hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.homingBarColor,
        visibleWhen: (params) => params.homingBarEnabled,
      },
    ],
  },
  {
    id: "stem",
    title: "取り付け部分",
    description: "Choc v2 の標準寸法を 0 として、材料や印刷条件に合わせたクリアランスを調整します。",
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
      {
        key: "stemOuterDelta",
        label: "円の大きさ補正",
        hint: "0 が標準です。プラスで外周円を太く、マイナスで細くします",
        unit: "mm",
        step: 0.02,
        visibleWhen: (params) => params.stemEnabled,
      },
      {
        key: "stemCrossMargin",
        label: "十字のマージン",
        hint: "0 が標準です。プラスで十字穴を広げ、マイナスで狭めます",
        unit: "mm",
        step: 0.02,
        visibleWhen: (params) => params.stemEnabled,
      },
      {
        key: "stemInsetDelta",
        label: "軸の開始位置補正",
        hint: "0 が標準です。プラスで底面からの開始位置を上げます",
        unit: "mm",
        step: 0.05,
        visibleWhen: (params) => params.stemEnabled,
      },
    ],
  },
];

const fieldConfigByKey = new Map(
  fieldGroups.flatMap((group) => group.fields).map((field) => [field.key, field]),
);
const colorFieldKeys = new Set(
  fieldGroups.flatMap((group) => group.fields).filter((field) => field.type === "color").map((field) => field.key),
);

function createFieldGroupCollapseState() {
  return Object.fromEntries(fieldGroups.map((group) => [group.id, true]));
}

function syncDerivedKeycapParams(params = state.keycapParams) {
  params.stemEnabled = params.stemType !== "none";
  return params;
}

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
  isImportDragActive: false,
  collapsedFieldGroups: createFieldGroupCollapseState(),
  keycapParams: syncDerivedKeycapParams(createDefaultKeycapParams()),
};

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

function isUiMotionEnabled() {
  return supportsUiViewTransitions && !reduceMotionQuery?.matches;
}

function toKebabCase(value) {
  return String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function createViewTransitionName(prefix, value) {
  const normalized = toKebabCase(value);
  return `${prefix}-${normalized || "item"}`;
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

function resolvePublicAssetUrl(relativePath) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(relativePath, baseUrl).toString();
}

function getColorFieldValue(fieldKey) {
  return normalizeHexColor(state.keycapParams[fieldKey]) ?? DEFAULT_KEYCAP_COLORS[fieldKey];
}

function getColorFieldNumber(fieldKey) {
  return hexColorToNumber(getColorFieldValue(fieldKey));
}

function getPartLabel(partName) {
  switch (partName) {
    case "legend":
      return "印字";
    case "homing":
      return "目印";
    default:
      return "本体";
  }
}

function describePartLabels(parts) {
  return parts.map((part) => getPartLabel(part)).join("、");
}

function setColorInputValidity(input, isValid) {
  input.setAttribute("aria-invalid", isValid ? "false" : "true");
  input.closest(".field-control")?.classList.toggle("is-invalid", !isValid);
}

function syncColorChip(fieldKey, colorValue = getColorFieldValue(fieldKey)) {
  app
    .querySelector(`[data-color-chip="${fieldKey}"]`)
    ?.style
    .setProperty("--field-color", colorValue);
}

function unwrapColorisFieldWrappers(root = app) {
  root?.querySelectorAll("input[data-coloris]").forEach((input) => {
    const wrapper = input.parentElement;
    if (!(wrapper instanceof HTMLElement) || !wrapper.classList.contains("clr-field")) {
      return;
    }

    wrapper.replaceWith(input);
  });
}

function configureColoris() {
  if (typeof window.Coloris !== "function") {
    return;
  }

  window.Coloris({
    parent: "body",
    alpha: false,
    format: "hex",
    theme: "pill",
    themeMode: "light",
    wrap: false,
    margin: 8,
    closeButton: true,
    closeLabel: "閉じる",
    swatches: COLORIS_SWATCHES,
  });

  unwrapColorisFieldWrappers();
}

function ensureColorisStylesheet() {
  if (document.querySelector('link[data-coloris-style="true"]')) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = resolvePublicAssetUrl(COLORIS_STYLE_PATH);
  link.dataset.colorisStyle = "true";
  document.head.append(link);
}

function ensureColorisLoaded() {
  ensureColorisStylesheet();

  if (typeof window.Coloris === "function") {
    configureColoris();
    return Promise.resolve(window.Coloris);
  }

  if (colorisLoadPromise) {
    return colorisLoadPromise;
  }

  colorisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = resolvePublicAssetUrl(COLORIS_SCRIPT_PATH);
    script.async = true;
    script.dataset.colorisScript = "true";
    script.addEventListener("load", () => {
      configureColoris();
      resolve(window.Coloris);
    }, { once: true });
    script.addEventListener("error", () => {
      colorisLoadPromise = null;
      reject(new Error("Coloris の読み込みに失敗しました。"));
    }, { once: true });
    document.head.append(script);
  });

  return colorisLoadPromise;
}

function isLegendTextSet(value = state.keycapParams.legendText) {
  return String(value ?? "").trim().length > 0;
}

function isLegendRenderable() {
  return state.keycapParams.legendEnabled && isLegendTextSet();
}

function renderShell() {
  if (app.querySelector(".app-shell")) {
    return;
  }

  app.innerHTML = `
    <main class="app-shell">
      <div class="drop-overlay" data-import-drop-overlay aria-hidden="true" hidden>
        <div class="drop-overlay__card">
          <strong>編集データ JSON をドロップ</strong>
          <span>保存済みの編集データを読み込み、現在の設定へ反映します。</span>
        </div>
      </div>
      <section class="editor-screen">
        <aside class="left-column">
          <article class="inspector-card">
            <nav
              class="segment-control"
              aria-label="workspace sections"
              data-segment-control
              style="--segment-count: ${workspaceSections.length}; --segment-index: 0;"
            >
              <span class="segment-control__indicator" aria-hidden="true"></span>
              ${workspaceSections
                .map(
                  (section) => `
                    <button
                      class="segment-link"
                      type="button"
                      data-sidebar-tab="${section.id}"
                      aria-pressed="false"
                    >
                      ${section.label}
                    </button>
                  `,
                )
                .join("")}
            </nav>
            <div class="inspector-content" data-inspector-content></div>
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

  app.querySelector("[data-segment-control]")?.addEventListener("click", handleSegmentControlClick);
  app.querySelector(".inspector-card")?.addEventListener("click", handleInspectorCardClick);
  app.querySelector(".inspector-card")?.addEventListener("input", handleInspectorCardInput);
  app.querySelector(".inspector-card")?.addEventListener("change", handleInspectorCardChange);
  app.querySelector(".inspector-card")?.addEventListener("compositionend", handleInspectorCardCompositionEnd);
  attachEditorDataDropListeners();
  syncImportDropOverlay();
  renderPreviewViewer();
}

function renderLayout() {
  const editorScreen = app.querySelector(".editor-screen");
  if (!editorScreen) {
    return;
  }

  editorScreen.className = `editor-screen editor-screen--${viewportLayoutMode}`;
}

function renderSegmentControl() {
  const segmentControl = app.querySelector("[data-segment-control]");
  if (!segmentControl) {
    return;
  }

  const activeIndex = workspaceSections.findIndex((section) => section.id === state.sidebarTab);
  segmentControl.style.setProperty("--segment-index", `${Math.max(activeIndex, 0)}`);

  segmentControl.querySelectorAll("[data-sidebar-tab]").forEach((button) => {
    const isActive = button.dataset.sidebarTab === state.sidebarTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function renderInspectorPanel() {
  const container = app.querySelector("[data-inspector-content]");
  if (!container) {
    return;
  }

  container.innerHTML = renderInspectorContent();
}

function render(options = {}) {
  const { animateInspector = false } = options;
  renderShell();

  const applyUpdate = () => {
    renderLayout();
    renderSegmentControl();
    renderInspectorPanel();
    configureColoris();
    syncImportDropOverlay();
  };

  if (animateInspector && isUiMotionEnabled()) {
    const transition = document.startViewTransition(applyUpdate);
    transition.finished.catch(() => {});
    return;
  }

  applyUpdate();
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
    <div class="inspector-panel inspector-panel--params">
      <div class="panel-intro">
        <h1 class="panel-title">設定</h1>
        <p class="panel-text">選んだキーキャップの形や印字を、入力に合わせて右側へ自動反映しながら調整できます。</p>
      </div>

      <div class="parameter-group-list">
        ${fieldGroups.map((group, index) => renderFieldGroup(group, index)).join("")}
      </div>
    </div>
  `;
}

function renderGuideTab() {
  return `
    <div class="inspector-panel inspector-panel--guide">
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
    </div>
  `;
}

function renderExportTab() {
  return `
    <div class="inspector-panel inspector-panel--export">
      <div class="panel-intro">
        <h1 class="panel-title">書き出し</h1>
        <p class="panel-text">3MF の印刷データと、あとで編集を再開するための JSON を保存できます。</p>
      </div>

      <div class="export-button-list">
        <button class="action-card" type="button" data-export="editor-data" ${state.exportsStatus === "running" ? "disabled" : ""}>
          <span class="chip-label">JSON</span>
          <strong>${state.exportsStatus === "running" ? "保存しています..." : "編集データを保存する"}</strong>
          <span class="action-card__text">保存した JSON は、この画面のどこへでもドラッグ&ドロップして取り込めます。読み込むと現在の設定を置き換えます。</span>
        </button>
        <button class="action-card" type="button" data-export="3mf" ${state.exportsStatus === "running" ? "disabled" : ""}>
          <span class="chip-label">3MF</span>
          <strong>${state.exportsStatus === "running" ? "保存しています..." : "3MFデータを保存する"}</strong>
          <span class="action-card__text">本体、目印、印字を含む印刷用データを 3MF 形式でまとめて保存します。</span>
        </button>
      </div>
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

function renderFieldGroup(group, groupIndex) {
  const visibleFields = group.fields.filter((field) => isFieldVisible(field));
  const groupId = group.id ?? `group-${groupIndex}`;
  const isCollapsed = state.collapsedFieldGroups[groupId] === true;
  const groupViewTransitionName = createViewTransitionName("field-group", groupId);
  const groupBodyId = `field-group-body-${groupId}`;
  const toggleLabel = isCollapsed ? `${group.title}を展開` : `${group.title}を折りたたむ`;
  const toggleIconUrl = isCollapsed ? CHEVRON_ICON_URLS.collapsed : CHEVRON_ICON_URLS.expanded;

  return `
    <section class="field-group-card" style="view-transition-name: ${groupViewTransitionName};">
      <div class="field-group-header">
        <div class="field-group-header__row">
          <h3>${group.title}</h3>
          <button
            class="field-group-toggle"
            type="button"
            data-field-group-toggle="${groupId}"
            aria-expanded="${isCollapsed ? "false" : "true"}"
            aria-controls="${groupBodyId}"
            aria-label="${toggleLabel}"
          >
            <img class="field-group-toggle__icon" src="${toggleIconUrl}" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="field-group-body" id="${groupBodyId}" ${isCollapsed ? "hidden" : ""}>
        <p class="field-group-description">${group.description}</p>
        <div class="field-grid">
          ${visibleFields.map((field) => renderField(field)).join("")}
        </div>
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
  const fieldViewTransitionName = createViewTransitionName("field", field.key);

  if (field.type === "checkbox") {
    return `
      <label class="field field--checkbox" style="view-transition-name: ${fieldViewTransitionName};">
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
      <label class="field" style="view-transition-name: ${fieldViewTransitionName};">
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
      <label class="field" style="view-transition-name: ${fieldViewTransitionName};">
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

  if (field.type === "color") {
    const normalizedValue = getColorFieldValue(field.key);
    const inputId = `field-${field.key}`;

    return `
      <div class="field field--color" style="view-transition-name: ${fieldViewTransitionName};">
        <label class="field-copy" for="${inputId}">
          <span class="field-label">${field.label}</span>
          <span class="field-hint">${field.hint ?? ""}</span>
        </label>
        <span class="field-control-cluster field-control-cluster--color">
          <span class="field-control field-control--color">
            <span class="field-color-chip" data-color-chip="${field.key}" style="--field-color: ${escapeHtml(normalizedValue)};"></span>
            <input
              id="${inputId}"
              type="text"
              data-field="${field.key}"
              data-coloris
              inputmode="text"
              spellcheck="false"
              autocomplete="off"
              aria-invalid="false"
              value="${escapeHtml(normalizedValue)}"
              maxlength="7"
              ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ""}
            />
          </span>
          <button class="field-color-button" type="button" data-color-picker-open="${field.key}">
            選ぶ
          </button>
        </span>
      </div>
    `;
  }

  if (field.type === "linked-size") {
    return `
      <label class="field field--linked-size" style="view-transition-name: ${fieldViewTransitionName};">
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
    <label class="field" style="view-transition-name: ${fieldViewTransitionName};">
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

function getClosestFromEventTarget(event, selector) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  return event.target.closest(selector);
}

function handleSegmentControlClick(event) {
  const button = getClosestFromEventTarget(event, "[data-sidebar-tab]");
  if (!button) {
    return;
  }

  handleSidebarTabChange({ currentTarget: button });
}

function handleInspectorCardClick(event) {
  const groupToggleButton = getClosestFromEventTarget(event, "[data-field-group-toggle]");
  if (groupToggleButton) {
    toggleFieldGroup(groupToggleButton.dataset.fieldGroupToggle);
    return;
  }

  const colorPickerButton = getClosestFromEventTarget(event, "[data-color-picker-open]");
  if (colorPickerButton) {
    openColorPicker(colorPickerButton.dataset.colorPickerOpen);
    return;
  }

  const runtimeButton = getClosestFromEventTarget(event, "[data-run-poc]");
  if (runtimeButton) {
    executeRuntimePoc();
    return;
  }

  const exportButton = getClosestFromEventTarget(event, "[data-export]");
  if (exportButton) {
    executeExport(exportButton.dataset.export);
  }
}

function handleInspectorCardInput(event) {
  const input = getClosestFromEventTarget(event, "[data-field]");
  if (!input || input.type === "checkbox" || input.tagName === "SELECT") {
    return;
  }

  handleFieldChange({
    currentTarget: input,
    deferPreview: typeof InputEvent !== "undefined" && event instanceof InputEvent && event.isComposing,
  });
}

function handleInspectorCardChange(event) {
  const input = getClosestFromEventTarget(event, "[data-field]");
  if (!input || (input.type !== "checkbox" && input.tagName !== "SELECT")) {
    return;
  }

  handleFieldChange({ currentTarget: input });
}

function handleInspectorCardCompositionEnd(event) {
  const input = getClosestFromEventTarget(event, "[data-field]");
  if (!input || input.tagName !== "INPUT" || input.type !== "text") {
    return;
  }

  handleFieldChange({ currentTarget: input });
}

function handleSidebarTabChange(event) {
  const nextTab = event.currentTarget.dataset.sidebarTab;
  if (!nextTab || nextTab === state.sidebarTab) {
    return;
  }

  state.sidebarTab = nextTab;
  render({ animateInspector: true });
}

function toggleFieldGroup(groupId) {
  if (!groupId || !(groupId in state.collapsedFieldGroups)) {
    return;
  }

  state.collapsedFieldGroups[groupId] = !state.collapsedFieldGroups[groupId];
  render({ animateInspector: true });
}

function handleViewportResize() {
  const nextMode = getViewportLayoutMode();
  if (nextMode !== viewportLayoutMode) {
    viewportLayoutMode = nextMode;
    render();
  }

  if (typeof window.Coloris === "function") {
    window.Coloris.updatePosition();
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

function pickEditorSelectors(params) {
  return Object.fromEntries(
    EDITOR_SELECTOR_KEYS
      .filter((key) => key in params)
      .map((key) => [key, params[key]]),
  );
}

function listEditableParamKeys(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const defaults = createDefaultKeycapParams(profileKey);

  // Preserve hidden geometry defaults as part of the editor state so profile switches
  // and JSON round-trips do not silently fall back to the SCAD preset values.
  return Object.keys(defaults);
}

function sanitizeEditorParamValue(fieldKey, value, fallback) {
  const fieldConfig = fieldConfigByKey.get(fieldKey);

  if (colorFieldKeys.has(fieldKey)) {
    return normalizeHexColor(value) ?? fallback;
  }

  if (fieldConfig?.type === "select") {
    const allowedValues = new Set(fieldConfig.options.map((option) => option.value));
    return allowedValues.has(value) ? value : fallback;
  }

  if (typeof fallback === "boolean") {
    return typeof value === "boolean" ? value : fallback;
  }

  if (typeof fallback === "number") {
    const nextValue = Number(value);
    return Number.isFinite(nextValue) ? nextValue : fallback;
  }

  if (typeof fallback === "string") {
    return typeof value === "string" ? value : fallback;
  }

  return value ?? fallback;
}

function createExportableKeycapParams(params = state.keycapParams) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const exportableParams = {};

  for (const key of listEditableParamKeys(profileKey)) {
    exportableParams[key] = sanitizeEditorParamValue(key, params[key], defaults[key]);
  }

  return exportableParams;
}

function createEditorDataPayload(params = state.keycapParams) {
  const sanitizedParams = createExportableKeycapParams(params);

  return {
    kind: EDITOR_DATA_KIND,
    schemaVersion: EDITOR_DATA_SCHEMA_VERSION,
    profileSchemaVersion: keycapEditorProfiles.schemaVersion ?? 1,
    savedAt: new Date().toISOString(),
    selectors: pickEditorSelectors(sanitizedParams),
    params: sanitizedParams,
  };
}

function buildEditorDataFilename(params = state.keycapParams) {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return `keycap-editor-${toKebabCase(params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY)}-${timestamp}.json`;
}

function parseEditorDataPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("編集データ JSON の形式が不正です。");
  }

  if (payload.kind !== EDITOR_DATA_KIND) {
    throw new Error("Keycaps Maker の編集データ JSON ではありません。");
  }

  if (payload.schemaVersion !== EDITOR_DATA_SCHEMA_VERSION) {
    throw new Error(`未対応の編集データ schemaVersion です: ${payload.schemaVersion}`);
  }

  if (!payload.params || typeof payload.params !== "object" || Array.isArray(payload.params)) {
    throw new Error("編集データ JSON に params がありません。");
  }

  const rawProfileKey = payload.selectors?.shapeProfile ?? payload.params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  if (!keycapProfileByKey.has(rawProfileKey)) {
    throw new Error(`未対応の形のベースです: ${rawProfileKey}`);
  }

  const defaults = createDefaultKeycapParams(rawProfileKey);
  const mergedRawParams = {
    ...pickEditorSelectors(defaults),
    ...(payload.selectors ?? {}),
    ...payload.params,
    shapeProfile: rawProfileKey,
  };
  const nextParams = {};

  for (const key of listEditableParamKeys(rawProfileKey)) {
    nextParams[key] = sanitizeEditorParamValue(key, mergedRawParams[key], defaults[key]);
  }

  return syncDerivedKeycapParams(nextParams);
}

function recordExportHistory(entry) {
  state.exportHistory.unshift(entry);
}

function setExportStatus(status, summary, historyEntry) {
  state.exportsStatus = status;
  state.exportsSummary = summary;

  if (historyEntry) {
    recordExportHistory(historyEntry);
  }
}

function applyShapeProfileParams(profileKey) {
  const defaults = createDefaultKeycapParams(profileKey);
  const nextParams = {};

  for (const key of listEditableParamKeys(profileKey)) {
    nextParams[key] = sanitizeEditorParamValue(key, state.keycapParams[key], defaults[key]);
  }

  nextParams.shapeProfile = profileKey;
  state.keycapParams = syncDerivedKeycapParams(nextParams);
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

function syncImportDropOverlay() {
  const overlay = app.querySelector("[data-import-drop-overlay]");
  if (!overlay) {
    return;
  }

  overlay.hidden = !state.isImportDragActive;
  overlay.classList.toggle("is-active", state.isImportDragActive);
  overlay.setAttribute("aria-hidden", state.isImportDragActive ? "false" : "true");
}

function setImportDragActive(isActive) {
  if (state.isImportDragActive === isActive) {
    return;
  }

  state.isImportDragActive = isActive;
  syncImportDropOverlay();
}

function isFileTransfer(dataTransfer) {
  return Array.from(dataTransfer?.types ?? []).includes("Files");
}

function resetEditorDataDropState() {
  editorDataDragDepth = 0;
  setImportDragActive(false);
}

function attachEditorDataDropListeners() {
  if (hasAttachedEditorDataDropListeners) {
    return;
  }

  hasAttachedEditorDataDropListeners = true;
  window.addEventListener("dragenter", handleWindowDragEnter);
  window.addEventListener("dragover", handleWindowDragOver);
  window.addEventListener("dragleave", handleWindowDragLeave);
  window.addEventListener("drop", handleWindowDrop);
  window.addEventListener("dragend", resetEditorDataDropState);
}

async function importEditorDataFile(file) {
  const startedAt = performance.now();
  const text = await file.text();
  const payload = JSON.parse(text);
  const nextParams = parseEditorDataPayload(payload);

  state.keycapParams = nextParams;
  state.editorStatus = "dirty";
  state.editorSummary = "読み込んだ編集データを反映待ち";
  setExportStatus(
    "success",
    `編集データを読み込みました (${file.name})`,
    {
      format: "editor-data-import",
      label: "編集データ読込",
      elapsedMs: Math.round(performance.now() - startedAt),
      byteLength: file.size,
      notes: `${file.name} を現在の編集内容へ反映`,
    },
  );

  render({ animateInspector: true });
  await executeKeycapPreview({ silent: true });
}

async function importEditorDataFromDrop(files) {
  const jsonFile = files.find((file) => file.name.toLowerCase().endsWith(".json"));
  if (!jsonFile) {
    throw new Error("JSON ファイルが見つかりません。");
  }

  await importEditorDataFile(jsonFile);
}

function handleWindowDragEnter(event) {
  if (!isFileTransfer(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  editorDataDragDepth += 1;
  setImportDragActive(true);
}

function handleWindowDragOver(event) {
  if (!isFileTransfer(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }

  setImportDragActive(true);
}

function handleWindowDragLeave(event) {
  if (!isFileTransfer(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  editorDataDragDepth = Math.max(editorDataDragDepth - 1, 0);
  if (editorDataDragDepth === 0) {
    setImportDragActive(false);
  }
}

async function handleWindowDrop(event) {
  if (!isFileTransfer(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  resetEditorDataDropState();

  try {
    await importEditorDataFromDrop(Array.from(event.dataTransfer?.files ?? []));
  } catch (error) {
    setExportStatus(
      "error",
      "編集データの読み込みに失敗しました",
      {
        format: "editor-data-import",
        label: "編集データ読込失敗",
        elapsedMs: 0,
        byteLength: 0,
        notes: `${error}`,
      },
    );
    render();
  }
}

function handleFieldChange(event) {
  const field = event.currentTarget.dataset.field;
  const input = event.currentTarget;
  const deferPreview = event.deferPreview === true;
  const fieldConfig = fieldConfigByKey.get(field);
  if (!field || !input) {
    return;
  }

  if (field === "keySizeUnits") {
    state.keycapParams.keyWidth = Number(input.value) * KEY_UNIT_MM;
    syncLinkedShapeInputs("keySizeUnits");
  } else if (input.type === "checkbox") {
    state.keycapParams[field] = input.checked;
  } else if (input.tagName === "SELECT") {
    if (field === "shapeProfile") {
      applyShapeProfileParams(input.value);
    } else {
      state.keycapParams[field] = input.value;
    }
  } else if (fieldConfig?.type === "color") {
    const normalizedColor = normalizeHexColor(input.value);
    if (!normalizedColor) {
      setColorInputValidity(input, false);
      return;
    }

    state.keycapParams[field] = normalizedColor;
    input.value = normalizedColor;
    setColorInputValidity(input, true);
    syncColorChip(field, normalizedColor);
  } else if (input.type === "text") {
    state.keycapParams[field] = input.value;
  } else {
    state.keycapParams[field] = Number(input.value);
    if (field === "keyWidth") {
      syncLinkedShapeInputs("keyWidth");
    }
  }

  syncDerivedKeycapParams();

  if (input.type === "checkbox") {
    input.parentElement?.querySelector("span:last-child")?.replaceChildren(input.checked ? "オン" : "オフ");
  }

  state.editorStatus = "dirty";
  state.editorSummary = "入力内容を反映待ち";

  if (field === "legendEnabled" || field === "homingBarEnabled" || EDITOR_SELECTOR_KEYS.includes(field)) {
    render({ animateInspector: true });
  }

  if (!deferPreview) {
    schedulePreviewRefresh();
  }
}

async function openColorPicker(fieldKey) {
  const input = app.querySelector(`[data-field="${fieldKey}"]`);
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const normalizedColor = normalizeHexColor(input.value) ?? getColorFieldValue(fieldKey);
  input.value = normalizedColor;
  setColorInputValidity(input, true);
  syncColorChip(fieldKey, normalizedColor);

  try {
    await ensureColorisLoaded();
  } catch (error) {
    console.warn(error);
  }

  input.focus();
  input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
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
  if (disposePreviewScene) {
    previewViewState = disposePreviewScene.captureViewState();
    disposePreviewScene.dispose();
    disposePreviewScene = null;
  }

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

  disposePreviewScene = mountPreviewScene(container, state.previewLayers, {
    initialViewState: previewViewState,
  });
}

function createColorLayerJob({ name, exportTarget, outputPath, colorFieldKey }) {
  return {
    name,
    exportTarget,
    outputPath,
    colorHex: getColorFieldValue(colorFieldKey),
    color: getColorFieldNumber(colorFieldKey),
  };
}

function createKeycapOffJobs(purpose) {
  if (purpose === "preview" || purpose === "3mf") {
    return [
      createColorLayerJob({
        name: "body",
        exportTarget: "body_core",
        outputPath: keycapBodyPreviewPath,
        colorFieldKey: "bodyColor",
      }),
      ...(state.keycapParams.homingBarEnabled
        ? [
            createColorLayerJob({
              name: "homing",
              exportTarget: "homing",
              outputPath: keycapHomingPreviewPath,
              colorFieldKey: "homingBarColor",
            }),
          ]
        : []),
      ...(isLegendRenderable()
        ? [
            createColorLayerJob({
              name: "legend",
              exportTarget: "legend",
              outputPath: keycapLegendPreviewPath,
              colorFieldKey: "legendColor",
            }),
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
  const requestId = ++latestPreviewRequestId;

  state.editorStatus = "running";
  state.editorSummary = "見た目を更新しています";
  if (!silent) {
    state.editorLogs = [];
    state.editorError = "";
  }

  try {
    const previewResults = await runKeycapOffJobs(createKeycapOffJobs("preview"));
    if (requestId !== latestPreviewRequestId) {
      return;
    }

    const totalElapsedMs = previewResults.reduce((sum, entry) => sum + entry.result.elapsedMs, 0);
    const totalVertices = previewResults.reduce((sum, entry) => sum + entry.mesh.vertices.length, 0);
    const totalFaces = previewResults.reduce((sum, entry) => sum + entry.mesh.faces.length, 0);
    const visiblePartLabels = describePartLabels(previewResults.map((entry) => entry.name));
    state.editorStatus = "success";
    state.editorSummary = `${Math.round(totalElapsedMs)} ms / ${previewResults.length} objects / ${totalVertices} vertices / ${totalFaces} triangles`;
    state.editorLogs = previewResults.flatMap((entry) =>
      entry.result.logs.map((log) => `[${entry.name}/${log.stream}] ${log.text}`),
    );
    state.editorError = previewResults.length > 1
      ? `見た目の更新が完了しました。${visiblePartLabels}を色ごとに分けて表示しています。`
      : `見た目の更新が完了しました。${visiblePartLabels}を表示しています。`;
    state.previewLayers = previewResults.map((entry) => ({
      name: entry.name,
      color: entry.color,
      mesh: entry.mesh,
    }));
  } catch (error) {
    if (requestId !== latestPreviewRequestId) {
      return;
    }

    state.editorStatus = "error";
    state.editorSummary = "見た目の更新に失敗しました";
    state.editorLogs = [];
    state.editorError = `${error}`;
    state.previewLayers = [];
  }

  renderPreviewViewer();
}

async function executeExport(format) {
  state.exportsStatus = "running";
  state.exportsSummary = "保存データを準備しています";
  render();

  try {
    if (format === "editor-data") {
      const startedAt = performance.now();
      const payload = createEditorDataPayload();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, buildEditorDataFilename(payload.params));
      setExportStatus(
        "success",
        `編集データを保存しました (${blob.size} bytes)`,
        {
          format,
          label: "編集データ JSON",
          elapsedMs: Math.round(performance.now() - startedAt),
          byteLength: blob.size,
          notes: "画面で編集するパラメータを JSON 形式で保存",
        },
      );
    } else if (format === "3mf") {
      const offResults = await runKeycapOffJobs(createKeycapOffJobs("3mf"));
      const savedPartLabels = describePartLabels(offResults.map((entry) => entry.name));
      const blob = create3mfBlob(
        offResults.map((entry) => ({
          name: `keycap-${entry.name}`,
          colorHex: entry.colorHex,
          ...entry.mesh,
        })),
      );
      downloadBlob(blob, keycap3mfPath);

      setExportStatus(
        "success",
        `3MFデータを保存しました (${blob.size} bytes / ${offResults.length} 個のパーツ)`,
        {
          format,
          label: "3MFデータ",
          elapsedMs: Math.round(offResults.reduce((sum, entry) => sum + entry.result.elapsedMs, 0)),
          byteLength: blob.size,
          notes: `${savedPartLabels}を 3MF 形式でまとめて保存`,
        },
      );
    } else {
      throw new Error(`未対応の export 形式です: ${format}`);
    }
  } catch (error) {
    setExportStatus(
      "error",
      "保存に失敗しました",
      {
        format,
        label: "保存失敗",
        elapsedMs: 0,
        byteLength: 0,
        notes: `${error}`,
      },
    );
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

ensureColorisLoaded().catch((error) => {
  console.warn(error);
});
