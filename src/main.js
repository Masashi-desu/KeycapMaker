import "./styles.css";
import keycapEditorProfiles, {
  createDefaultKeycapParams,
  DEFAULT_SHAPE_PROFILE_KEY,
  EDITOR_SELECTOR_KEYS,
  getShapeProfileFieldGroups,
  getShapeProfileFieldOverride,
  getShapeProfileGeometryDefaults,
  resolveShapeGeometryType,
  SHAPE_PROFILE_MAP,
} from "./data/keycap-shape-registry.js";
import { runOpenScad } from "./lib/openscad-client.js";
import { hexColorToNumber, normalizeHexColor } from "./lib/color-utils.js";
import { create3mfBlob } from "./lib/export-3mf.js";
import { parseOff } from "./lib/off-parser.js";
import {
  DEFAULT_KEYCAP_LEGEND_FONT_KEY,
  KEYCAP_LEGEND_FONTS,
  buildKeycapArgs,
  createKeycapFiles,
  getKeycapLegendFontStyleOptions,
  resolveKeycapLegendFont,
} from "./lib/keycap-scad-bundle.js";

const app = document.querySelector("#app");
const keycapBodyPreviewPath = "/outputs/keycap-body-preview.off";
const keycapRimPreviewPath = "/outputs/keycap-rim-preview.off";
const keycapHomingPreviewPath = "/outputs/keycap-homing-preview.off";
const keycapLegendPreviewPath = "/outputs/keycap-legend-preview.off";
const DEFAULT_EXPORT_BASE_NAME = "keycap-preview";
const EDITOR_DATA_KIND = "keycap-maker/editor-params";
const LEGACY_EDITOR_DATA_KINDS = new Set([EDITOR_DATA_KIND.replace("keycap-maker", "keycap" + "s-maker")]);
const EDITOR_DATA_SCHEMA_VERSION = 4;
const CHEVRON_ICON_URLS = Object.freeze({
  expanded: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/chevron-up.svg",
  collapsed: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/chevron-down.svg",
});
const SEARCH_ICON_MARKUP = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M10.5 4.5a6 6 0 1 0 0 12a6 6 0 0 0 0-12m0-1.5a7.5 7.5 0 1 1 0 15a7.5 7.5 0 0 1 0-15m8.56 14.94l2.22 2.22a.75.75 0 1 1-1.06 1.06L18 19a.75.75 0 0 1 1.06-1.06"
      fill="currentColor"
    />
  </svg>
`;
let disposePreviewScene = null;
let previewDebounceTimer = 0;
let previewSceneModulePromise = null;
let colorisLoadPromise = null;
let latestPreviewRequestId = 0;
let previewViewState = null;
let viewportLayoutMode = getViewportLayoutMode();
let hasAttachedEditorDataDropListeners = false;
let editorDataDragDepth = 0;
let fontAttributionCopyResetTimer = 0;
const legendFontPreviewPromises = new Map();
let pendingLegendFontPickerFocus = false;
const textDecoder = new TextDecoder();
const supportsUiViewTransitions = typeof document.startViewTransition === "function";
const reduceMotionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
const KEY_UNIT_MM = 18;
const LEGEND_MIN_SIZE = 0.5;
const LEGEND_OUTLINE_MIN = -1.2;
const LEGEND_OUTLINE_MAX = 1.2;
const LEGEND_FONT_STYLE_FALLBACK_KEY = "font-default";
const COLORIS_STYLE_PATH = "vendor/coloris/coloris.min.css";
const COLORIS_SCRIPT_PATH = "vendor/coloris/coloris.min.js";
const DEFAULT_KEYCAP_COLORS = Object.freeze({
  bodyColor: "#f8f9fa",
  rimColor: "#d8ccb8",
  legendColor: "#212529",
  homingBarColor: "#ff7f00",
});
const COLORIS_SWATCHES = Object.freeze([
  DEFAULT_KEYCAP_COLORS.bodyColor,
  DEFAULT_KEYCAP_COLORS.rimColor,
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

const workspaceSections = [
  {
    id: "params",
    label: "設定",
  },
  {
    id: "export",
    label: "書き出し",
  },
];

function isTypewriterShapeProfile(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return resolveShapeGeometryType(profileKey) === "typewriter";
}

function resolveLegendFontConfig(fontKey = DEFAULT_KEYCAP_LEGEND_FONT_KEY) {
  return resolveKeycapLegendFont(fontKey);
}

function normalizeLegendFontPickerQuery(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getLegendFontPickerResults(query = state.legendFontPickerQuery) {
  const normalizedQuery = normalizeLegendFontPickerQuery(query);
  if (!normalizedQuery) {
    return KEYCAP_LEGEND_FONTS;
  }

  return KEYCAP_LEGEND_FONTS.filter((font) => {
    const searchLabel = String(font.searchLabel ?? font.label).toLowerCase();
    const fontName = String(font.fontName ?? "").toLowerCase();
    return searchLabel.includes(normalizedQuery) || fontName.includes(normalizedQuery);
  });
}

function getLegendFontFieldHint(params) {
  const selectedFont = resolveLegendFontConfig(params.legendFontKey);
  return selectedFont.fontKind === "variable"
    ? "虫眼鏡から検索できます。対応 style は右側で選びます"
    : "虫眼鏡から検索できます";
}

function getLegendFontStyleFieldOptions(params = state.keycapParams) {
  const nativeStyleOptions = getKeycapLegendFontStyleOptions(params.legendFontKey);
  if (nativeStyleOptions.length === 0) {
    return [{ value: LEGEND_FONT_STYLE_FALLBACK_KEY, label: "フォント名どおり" }];
  }

  return nativeStyleOptions.map((option) => ({
    value: option.key,
    label: option.label,
  }));
}

function isLegendFontStyleSelectable(params = state.keycapParams) {
  return getKeycapLegendFontStyleOptions(params.legendFontKey).length > 0;
}

function getLegendFontStyleHint(params) {
  return isLegendFontStyleSelectable(params)
    ? "内蔵 style を使います"
    : "フォント名どおりに使います";
}

function clampTypewriterCornerRadius(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.max(Number(fallback) || 0, 0);
  }

  return Math.max(nextValue, 0);
}

function getTypewriterCornerRadiusHint(params) {
  const maxRadius = Math.max(Math.min(Number(params.keyWidth ?? 0), Number(params.keyDepth ?? 0)) / 2, 0);
  return `${formatMillimeter(maxRadius)} で丸、0 mm に近づけると角が立ちます`;
}

function clampNonNegativeNumber(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.max(Number(fallback) || 0, 0);
  }

  return Math.max(nextValue, 0);
}

function getTypewriterRimMaxWidth(params = state.keycapParams) {
  return Math.max(Math.min(Number(params.keyWidth ?? 0), Number(params.keyDepth ?? 0)) / 2, 0);
}

function clampTypewriterRimWidth(value, params = state.keycapParams, fallback = 0) {
  const maxWidth = getTypewriterRimMaxWidth(params);
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.min(Math.max(Number(fallback) || 0, 0), maxWidth);
  }

  return Math.min(Math.max(nextValue, 0), maxWidth);
}

function getTypewriterRimWidthHint(params) {
  const maxWidth = getTypewriterRimMaxWidth(params);
  return `キートップ正面から見た帯の幅です。${formatMillimeter(maxWidth)} で全面まで広がります`;
}

function getTypewriterRimHeightUpHint() {
  return "0 でキートップ上面と面一です。プラスで上へ伸びます";
}

function getTypewriterRimHeightDownHint() {
  return "0 でキートップ下面と面一です。プラスで下へ伸びます";
}

function clampLegendOutlineDelta(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return Math.min(Math.max(nextValue, LEGEND_OUTLINE_MIN), LEGEND_OUTLINE_MAX);
}

function getLegendOutlineHint() {
  return "0 が元の輪郭です。プラスで太く、マイナスで細くします";
}

function syncLegendFontParams(params = state.keycapParams) {
  params.legendFontKey = resolveLegendFontConfig(params.legendFontKey).key;
  const styleOptions = getLegendFontStyleFieldOptions(params);
  const fallbackStyleKey = styleOptions[0]?.value ?? LEGEND_FONT_STYLE_FALLBACK_KEY;
  const allowedStyleKeys = new Set(styleOptions.map((option) => option.value));
  params.legendFontStyleKey = allowedStyleKeys.has(params.legendFontStyleKey)
    ? params.legendFontStyleKey
    : fallbackStyleKey;
  params.legendOutlineDelta = clampLegendOutlineDelta(params.legendOutlineDelta, 0);
  return params;
}

const STEM_TYPE_OPTIONS = Object.freeze([
  { value: "none", label: "なし" },
  { value: "mx", label: "MX 互換" },
  { value: "choc_v1", label: "Choc v1" },
  { value: "choc_v2", label: "Choc v2" },
  { value: "alps", label: "Alps / Matias" },
]);
const STEM_TYPE_LABELS = new Map(STEM_TYPE_OPTIONS.map((option) => [option.value, option.label]));
const CROSS_COMPATIBLE_STEM_TYPES = new Set(["mx", "choc_v2"]);
const SETTINGS_NAME_FIELD = Object.freeze({
  key: "name",
  label: "名称",
  hint: "3MF と編集データ JSON の保存名に使います",
  type: "text",
  maxLength: 80,
  placeholder: DEFAULT_EXPORT_BASE_NAME,
});
const GEOMETRY_TYPE_RESET_FIELDS = new Set([
  "topCenterHeight",
  "topScale",
  "dishRadius",
  "dishDepth",
  "typewriterCornerRadius",
]);

function isSupportedStemType(stemType) {
  return STEM_TYPE_LABELS.has(stemType);
}

function isCrossCompatibleStemType(stemType) {
  return CROSS_COMPATIBLE_STEM_TYPES.has(stemType);
}

function resolveDefaultStemType(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const defaults = createDefaultKeycapParams(profileKey);
  return isSupportedStemType(defaults.stemType) ? defaults.stemType : "choc_v2";
}

function resolveStemType(params = {}) {
  if (isSupportedStemType(params.stemType)) {
    return params.stemType;
  }

  return resolveDefaultStemType(params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY);
}

function getStemGroupDescription(params) {
  const stemType = resolveStemType(params);

  switch (stemType) {
    case "none":
      return "取り付け部分を作りません。外形や印字だけを確認したいとき向けです。";
    case "mx":
      return "Cherry MX 互換の十字形状です。Cherry / Gateron / Kailh BOX など、一般的なメカニカルキーボード用の軸に合います。";
    case "choc_v1":
      return "Kailh Choc v1 用の 2 本爪形状です。薄型キーボード向けの Choc v1 軸に合います。";
    case "alps":
      return "Alps / Matias 系の差し込み形状です。対応する Alps 系の軸に合います。";
    default:
      return "Kailh Choc v2 用の十字形状です。Choc v2 軸に合う取り付け部分を作ります。";
  }
}

function getStemOuterHint(params) {
  return resolveStemType(params) === "mx"
    ? "0 が標準です。プラスで外周円を太く、マイナスで細くします"
    : "0 が標準です。プラスで外周円を太く、マイナスで細くします";
}

function getStemFitHint(params) {
  switch (resolveStemType(params)) {
    case "mx":
    case "choc_v2":
      return "0 が標準です。プラスで十字穴を広げ、マイナスで狭めます";
    case "choc_v1":
      return "0 が標準です。プラスで 2 本爪を細くして緩く、マイナスで太くしてきつくします";
    case "alps":
      return "0 が標準です。プラスで差し込み部を細くして緩く、マイナスで太くしてきつくします";
    default:
      return "取り付け部分を作らないときは使いません";
  }
}

function getStemInsetHint(params) {
  return resolveStemType(params) === "none"
    ? "取り付け部分を作らないときは使いません"
    : "0 が標準です。プラスで底面からの開始位置を上げ、内部干渉を避けます";
}

const TOP_SLOPE_INPUT_MODE_OPTIONS = Object.freeze([
  { value: "angle", label: "角度で調整" },
  { value: "edge-height", label: "端の高さで調整" },
]);
const TOP_SLOPE_INPUT_MODE_LABELS = new Set(TOP_SLOPE_INPUT_MODE_OPTIONS.map((option) => option.value));

function clampMinimum(value, fallback, minimum) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, minimum) : fallback;
}

function degTan(value) {
  return Math.tan((Number(value) * Math.PI) / 180);
}

function atanDeg(value) {
  return (Math.atan(value) * 180) / Math.PI;
}

function resolveTopSlopeInputMode(value) {
  return TOP_SLOPE_INPUT_MODE_LABELS.has(value) ? value : "angle";
}

function resolveShapeProfileGeometryDefaults(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const geometryDefaults = getShapeProfileGeometryDefaults(profileKey);
  const geometryType = resolveShapeGeometryType(profileKey);

  return {
    geometryType,
    profileFrontAngle: clampMinimum(geometryDefaults.profileFrontAngle, Number(geometryDefaults.profileFrontAngle) || 0, 0),
    profileBackAngle: clampMinimum(geometryDefaults.profileBackAngle, Number(geometryDefaults.profileBackAngle) || 0, 0),
    profileLeftAngle: clampMinimum(geometryDefaults.profileLeftAngle, Number(geometryDefaults.profileLeftAngle) || 0, 0),
    profileRightAngle: clampMinimum(geometryDefaults.profileRightAngle, Number(geometryDefaults.profileRightAngle) || 0, 0),
    topThickness: clampMinimum(geometryDefaults.topThickness, Number(geometryDefaults.topThickness) || 0.05, 0.05),
    bottomCornerRadius: clampMinimum(geometryDefaults.bottomCornerRadius, Number(geometryDefaults.bottomCornerRadius) || 0, 0),
    topCornerRadius: clampMinimum(geometryDefaults.topCornerRadius, Number(geometryDefaults.topCornerRadius) || 0, 0),
  };
}

function resolveProfileAngles(params = {}) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const geometryDefaults = resolveShapeProfileGeometryDefaults(profileKey);

  if (geometryDefaults.geometryType === "typewriter") {
    return {
      front: 0,
      back: 0,
      left: 0,
      right: 0,
      topThickness: geometryDefaults.topThickness,
    };
  }

  const topScale = Number(params.topScale ?? defaults.topScale ?? 1);
  const defaultTopScale = Number(defaults.topScale ?? 1);
  const taperFactor = defaultTopScale >= 1
    ? 1
    : Math.max((1 - topScale) / Math.max(1 - defaultTopScale, 0.01), 0);

  return {
    front: Math.max(geometryDefaults.profileFrontAngle * taperFactor, 0.1),
    back: Math.max(geometryDefaults.profileBackAngle * taperFactor, 0.1),
    left: Math.max(geometryDefaults.profileLeftAngle * taperFactor, 0.1),
    right: Math.max(geometryDefaults.profileRightAngle * taperFactor, 0.1),
    topThickness: geometryDefaults.topThickness,
  };
}

function resolveTopPlaneGeometry(params = {}) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const resolvedAngles = resolveProfileAngles(params);
  const keyWidth = clampMinimum(params.keyWidth, defaults.keyWidth ?? 18, 1);
  const keyDepth = clampMinimum(params.keyDepth, defaults.keyDepth ?? 18, 1);
  const topCenterHeight = clampMinimum(params.topCenterHeight, defaults.topCenterHeight ?? 9.5, 0.1);
  const topLeft = -keyWidth / 2 + topCenterHeight * degTan(resolvedAngles.left);
  const topRight = keyWidth / 2 - topCenterHeight * degTan(resolvedAngles.right);
  const topFront = -keyDepth / 2 + topCenterHeight * degTan(resolvedAngles.front);
  const topBack = keyDepth / 2 - topCenterHeight * degTan(resolvedAngles.back);

  return {
    topCenterHeight,
    topLeft,
    topRight,
    topFront,
    topBack,
    topThickness: resolvedAngles.topThickness,
  };
}

function resolveTopEdgeHeights(params = {}) {
  const geometry = resolveTopPlaneGeometry(params);
  const topPitchDeg = Number(params.topPitchDeg ?? 0);
  const topRollDeg = Number(params.topRollDeg ?? 0);
  const pitchSlope = degTan(topPitchDeg);
  const rollSlope = degTan(topRollDeg);

  return {
    topFrontHeight: geometry.topCenterHeight + geometry.topFront * pitchSlope,
    topBackHeight: geometry.topCenterHeight + geometry.topBack * pitchSlope,
    topLeftHeight: geometry.topCenterHeight + geometry.topLeft * rollSlope,
    topRightHeight: geometry.topCenterHeight + geometry.topRight * rollSlope,
    topVisibleCenterHeight: geometry.topCenterHeight - Math.max(Number(params.dishDepth ?? 0), 0),
  };
}

function getTopCenterHeightHint(params) {
  if (isTypewriterShapeProfile(params.shapeProfile)) {
    return "薄いキートップの底から上面までの厚みです";
  }

  return `dish を付ける前のキートップ中央です。現在の中央表面は ${formatMillimeter(params.topVisibleCenterHeight)} です`;
}

function getTopPitchHint(params) {
  return `プラスで奥が高くなります。現在: 手前 ${formatMillimeter(params.topFrontHeight)} / 奥 ${formatMillimeter(params.topBackHeight)}`;
}

function getTopRollHint(params) {
  return `プラスで右が高くなります。現在: 左 ${formatMillimeter(params.topLeftHeight)} / 右 ${formatMillimeter(params.topRightHeight)}`;
}

function getTopFrontHeightHint(params) {
  return `上面基準面の手前高さです。中央高さは固定され、現在の前後傾斜は ${formatDegree(params.topPitchDeg)} です`;
}

function getTopBackHeightHint(params) {
  return `上面基準面の奥高さです。中央高さは固定され、現在の前後傾斜は ${formatDegree(params.topPitchDeg)} です`;
}

function getTopLeftHeightHint(params) {
  return `上面基準面の左高さです。中央高さは固定され、現在の左右傾斜は ${formatDegree(params.topRollDeg)} です`;
}

function getTopRightHeightHint(params) {
  return `上面基準面の右高さです。中央高さは固定され、現在の左右傾斜は ${formatDegree(params.topRollDeg)} です`;
}

const fieldGroupTemplates = [
  {
    id: "shape",
    title: "キーキャップの形",
    description: (params) => (
      isTypewriterShapeProfile(params.shapeProfile)
        ? "タイプライター風の薄いキートップ外形を調整します。横幅は 18 mm を 1u として換算し、R を大きくすると丸く、小さくすると四角に近づきます。"
        : "キーキャップ全体の大きさと、上に向かって細くなる具合を調整します。キーサイズは横幅と連動していて、18 mm を 1u として換算します。"
    ),
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
      {
        key: "wallThickness",
        label: "肉厚",
        hint: "キーキャップの丈夫さに関わる厚みです",
        unit: "mm",
        step: 0.05,
        min: 0.4,
      },
      {
        key: "typewriterCornerRadius",
        label: "R",
        hint: (params) => getTypewriterCornerRadiusHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
      },
      {
        key: "topScale",
        label: "上面のすぼまり",
        hint: "数字を小さくすると上面が細く見えます",
        unit: "",
        step: 0.01,
        min: 0.5,
        max: 1,
      },
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
    id: "top",
    title: "キートップ",
    description: "上面中央の基準高さを固定したまま、前後と左右の傾きを角度または端の高さで編集できます。端の高さに切り替えた場合も内部では pitch / roll に正規化されます。",
    fields: [
      {
        key: "topCenterHeight",
        label: (params) => (isTypewriterShapeProfile(params.shapeProfile) ? "キートップの厚み" : "上面中央の高さ"),
        hint: (params) => getTopCenterHeightHint(params),
        unit: "mm",
        step: 0.1,
        min: 1,
      },
      {
        key: "rimEnabled",
        label: "キーリムを付ける",
        hint: "キートップ外周を別パーツで覆います",
        type: "checkbox",
      },
      {
        key: "rimWidth",
        label: "キーリムの幅",
        hint: (params) => getTypewriterRimWidthHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "rimHeightUp",
        label: "上方向の高さ",
        hint: () => getTypewriterRimHeightUpHint(),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "rimHeightDown",
        label: "下方向の高さ",
        hint: () => getTypewriterRimHeightDownHint(),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "rimColor",
        label: "キーリムの色",
        hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.rimColor,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "topSlopeInputMode",
        label: "傾きの入力方法",
        hint: "角度で入れるか、端の高さで入れるかを選びます",
        type: "select",
        options: TOP_SLOPE_INPUT_MODE_OPTIONS,
      },
      {
        key: "topPitchDeg",
        label: "手前から奥の傾斜",
        hint: (params) => getTopPitchHint(params),
        unit: "deg",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "angle",
      },
      {
        key: "topRollDeg",
        label: "左右の傾斜",
        hint: (params) => getTopRollHint(params),
        unit: "deg",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "angle",
      },
      {
        key: "topFrontHeight",
        label: "手前高さ",
        hint: (params) => getTopFrontHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
      {
        key: "topBackHeight",
        label: "奥高さ",
        hint: (params) => getTopBackHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
      {
        key: "topLeftHeight",
        label: "左高さ",
        hint: (params) => getTopLeftHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
      {
        key: "topRightHeight",
        label: "右高さ",
        hint: (params) => getTopRightHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
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
        hint: (params) => getLegendFontFieldHint(params),
        type: "font-search",
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendFontStyleKey",
        label: "フォント内スタイル",
        hint: (params) => getLegendFontStyleHint(params),
        type: "select",
        options: (params) => getLegendFontStyleFieldOptions(params),
        disabledWhen: (params) => !isLegendFontStyleSelectable(params),
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendUnderlineEnabled",
        label: "下線を付ける",
        hint: "下線位置と太さは font ファイルの情報を使います。任意の見た目へ置き換えません",
        type: "checkbox",
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendSize",
        label: "文字の大きさ",
        hint: "印字する文字の大きさを変更します。",
        unit: "mm",
        step: 0.1,
        min: LEGEND_MIN_SIZE,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendOutlineDelta",
        label: "太さ補正",
        hint: () => getLegendOutlineHint(),
        unit: "mm",
        step: 0.02,
        min: LEGEND_OUTLINE_MIN,
        max: LEGEND_OUTLINE_MAX,
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
    description: (params) => getStemGroupDescription(params),
    fields: [
      {
        key: "stemType",
        label: "取り付け方式",
        hint: "キーキャップが合う軸の種類を選びます",
        type: "select",
        options: STEM_TYPE_OPTIONS,
      },
      {
        key: "stemOuterDelta",
        label: "外周の補正",
        hint: (params) => getStemOuterHint(params),
        unit: "mm",
        step: 0.02,
        visibleWhen: (params) => params.stemEnabled && isCrossCompatibleStemType(resolveStemType(params)),
      },
      {
        key: "stemCrossMargin",
        label: "はまりのゆとり",
        hint: (params) => getStemFitHint(params),
        unit: "mm",
        step: 0.02,
        visibleWhen: (params) => params.stemEnabled,
      },
      {
        key: "stemInsetDelta",
        label: "軸の開始位置補正",
        hint: (params) => getStemInsetHint(params),
        unit: "mm",
        step: 0.05,
        visibleWhen: (params) => params.stemEnabled,
      },
    ],
  },
];

const fieldConfigByKey = new Map([
  [SETTINGS_NAME_FIELD.key, SETTINGS_NAME_FIELD],
  ...fieldGroupTemplates.flatMap((group) => group.fields).map((field) => [field.key, field]),
]);
const colorFieldKeys = new Set(
  fieldGroupTemplates.flatMap((group) => group.fields).filter((field) => field.type === "color").map((field) => field.key),
);

function createFieldGroupCollapseState() {
  const groupIds = keycapEditorProfiles.profiles.flatMap((profile) => (profile.fieldGroups ?? []).map((group) => group.id));
  return Object.fromEntries(Array.from(new Set(groupIds)).map((groupId) => [groupId, true]));
}

const FIELD_GROUP_DESCRIPTION_RESOLVERS = Object.freeze({
  "stem-group": (params) => getStemGroupDescription(params),
});

function getFieldConfig(fieldKey, profileKey = state.keycapParams?.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY) {
  const baseField = fieldConfigByKey.get(fieldKey);
  if (!baseField) {
    return null;
  }

  const override = getShapeProfileFieldOverride(profileKey, fieldKey) ?? {};
  return {
    ...baseField,
    ...override,
  };
}

function getActiveFieldGroups(profileKey = state.keycapParams?.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY) {
  return getShapeProfileFieldGroups(profileKey)
    .map((group) => ({
      ...group,
      fields: (group.fieldKeys ?? [])
        .map((fieldKey) => getFieldConfig(fieldKey, profileKey))
        .filter(Boolean),
      description: group.descriptionKey != null
        ? (FIELD_GROUP_DESCRIPTION_RESOLVERS[group.descriptionKey] ?? group.description ?? "")
        : group.description,
    }));
}

function clampLegendSize(value, fallback = LEGEND_MIN_SIZE) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, LEGEND_MIN_SIZE) : fallback;
}

function syncDerivedKeycapParams(params = state.keycapParams) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const defaultLegendSize = clampLegendSize(
    defaults.legendSize,
    LEGEND_MIN_SIZE,
  );

  params.topCenterHeight = clampMinimum(params.topCenterHeight, defaults.topCenterHeight ?? 9.5, 0.1);
  params.topPitchDeg = Number.isFinite(Number(params.topPitchDeg)) ? Number(params.topPitchDeg) : Number(defaults.topPitchDeg ?? 0);
  params.topRollDeg = Number.isFinite(Number(params.topRollDeg)) ? Number(params.topRollDeg) : Number(defaults.topRollDeg ?? 0);
  params.topSlopeInputMode = resolveTopSlopeInputMode(params.topSlopeInputMode ?? defaults.topSlopeInputMode);
  params.typewriterCornerRadius = clampTypewriterCornerRadius(
    params.typewriterCornerRadius,
    defaults.typewriterCornerRadius ?? Math.min(Number(params.keyWidth ?? defaults.keyWidth ?? 18), Number(params.keyDepth ?? defaults.keyDepth ?? 18)) / 2,
  );
  params.rimWidth = clampTypewriterRimWidth(params.rimWidth, params, defaults.rimWidth ?? 0);
  params.rimHeightUp = clampNonNegativeNumber(params.rimHeightUp, defaults.rimHeightUp ?? 0);
  params.rimHeightDown = clampNonNegativeNumber(params.rimHeightDown, defaults.rimHeightDown ?? 0);
  syncLegendFontParams(params);
  params.legendSize = clampLegendSize(params.legendSize, defaultLegendSize);
  Object.assign(params, resolveTopEdgeHeights(params));
  params.stemType = resolveStemType(params);
  params.stemEnabled = params.stemType !== "none";
  return params;
}

const state = {
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
  legendFontPickerOpen: false,
  legendFontPickerQuery: "",
  copiedFontAttributionKey: "",
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

function sanitizeExportBaseName(value, fallback = DEFAULT_EXPORT_BASE_NAME) {
  const fallbackValue = String(fallback ?? "").trim() || DEFAULT_EXPORT_BASE_NAME;
  const normalized = String(value ?? "")
    .trim()
    .replace(/\.(json|3mf)$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return normalized || fallbackValue;
}

function createViewTransitionName(prefix, value) {
  const normalized = toKebabCase(value);
  return `${prefix}-${normalized || "item"}`;
}

function formatMillimeter(value, digits = 1) {
  return `${Number(value).toFixed(digits)} mm`;
}

function formatDegree(value, digits = 1) {
  return `${Number(value).toFixed(digits)}°`;
}

function countStepDigits(step) {
  const rawStep = `${step ?? ""}`;
  if (!rawStep.includes(".")) {
    return 0;
  }

  return rawStep.split(".")[1].replace(/0+$/, "").length;
}

function formatNumericFieldValue(fieldKey, value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return "";
  }

  const fieldConfig = getFieldConfig(fieldKey);
  const digits = Math.min(countStepDigits(fieldConfig?.step) + 1, 3);
  return `${Number(nextValue.toFixed(digits))}`;
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
    case "rim":
      return "キーリム";
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

function isTypewriterRimRenderable(params = state.keycapParams) {
  return isTypewriterShapeProfile(params.shapeProfile)
    && params.rimEnabled
    && Number(params.rimWidth) > 0;
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
  app.querySelector(".inspector-card")?.addEventListener("keydown", handleInspectorCardKeydown);
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
    focusLegendFontPickerQuery();
  };

  if (animateInspector && isUiMotionEnabled()) {
    const transition = document.startViewTransition(applyUpdate);
    transition.finished.catch(() => {});
    return;
  }

  applyUpdate();
}

function renderInspectorContent() {
  if (state.sidebarTab === "export") {
    return renderExportTab();
  }

  return renderParametersTab();
}

function focusLegendFontPickerQuery() {
  if (!pendingLegendFontPickerFocus) {
    return;
  }

  pendingLegendFontPickerFocus = false;
  const input = app.querySelector("[data-font-picker-query]");
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  window.requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

function renderParametersTab() {
  const activeFieldGroups = getActiveFieldGroups();

  return `
    <div class="inspector-panel inspector-panel--params">
      <div class="panel-intro">
        <h1 class="panel-title">設定</h1>
        <p class="panel-text">選んだキーキャップの形や印字を、入力に合わせて右側へ自動反映しながら調整できます。</p>
      </div>

      <div class="parameter-group-list">
        ${renderNameFieldCard()}
        ${activeFieldGroups.map((group, index) => renderFieldGroup(group, index)).join("")}
      </div>
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

function renderNameFieldCard() {
  const groupViewTransitionName = createViewTransitionName("field-group", SETTINGS_NAME_FIELD.key);
  const fieldViewTransitionName = createViewTransitionName("field", SETTINGS_NAME_FIELD.key);
  const value = state.keycapParams[SETTINGS_NAME_FIELD.key];

  return `
    <section class="field-group-card" style="view-transition-name: ${groupViewTransitionName};">
      <div class="field-group-header">
        <div class="field-group-header__row">
          <h3>名称</h3>
        </div>
      </div>
      <div class="field-group-body">
        <p class="field-group-description">保存するときの名前です。3MF と編集データ JSON の両方に使われ、あとで読み込んでもこの名前が残ります。</p>
        <span class="field-control name-field-control" style="view-transition-name: ${fieldViewTransitionName};">
          <input
            id="settings-name-input"
            type="text"
            data-field="${SETTINGS_NAME_FIELD.key}"
            value="${escapeHtml(value)}"
            aria-label="${escapeHtml(SETTINGS_NAME_FIELD.label)}"
            ${SETTINGS_NAME_FIELD.maxLength != null ? `maxlength="${SETTINGS_NAME_FIELD.maxLength}"` : ""}
            ${SETTINGS_NAME_FIELD.placeholder ? `placeholder="${escapeHtml(SETTINGS_NAME_FIELD.placeholder)}"` : ""}
            spellcheck="false"
            autocomplete="off"
          />
        </span>
      </div>
    </section>
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
  const groupDescription = resolveDynamicCopy(group.description);

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
        <p class="field-group-description">${groupDescription}</p>
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

function resolveDynamicCopy(value, params = state.keycapParams) {
  return typeof value === "function" ? value(params) : (value ?? "");
}

function resolveFieldOptions(field, params = state.keycapParams) {
  if (typeof field.options === "function") {
    return field.options(params);
  }

  return field.options ?? [];
}

function isFieldDisabled(field, params = state.keycapParams) {
  return typeof field.disabledWhen === "function" ? field.disabledWhen(params) : false;
}

async function ensureLegendFontPreviewLoaded(font) {
  if (!font?.measurementFamily || typeof FontFace === "undefined" || typeof document === "undefined") {
    return null;
  }

  const cachedPromise = legendFontPreviewPromises.get(font.key);
  if (cachedPromise) {
    return cachedPromise;
  }

  const descriptors = font.fontKind === "variable"
    ? { style: "normal", weight: "100 900" }
    : { style: "normal", weight: `${font.cssWeight ?? 400}` };
  const previewPromise = new FontFace(
    font.measurementFamily,
    `url(${resolvePublicAssetUrl(font.assetPath)})`,
    descriptors,
  )
    .load()
    .then((loadedFace) => {
      document.fonts.add(loadedFace);
      return loadedFace;
    })
    .catch((error) => {
      legendFontPreviewPromises.delete(font.key);
      console.warn(error);
      return null;
    });

  legendFontPreviewPromises.set(font.key, previewPromise);
  return previewPromise;
}

function warmLegendFontPreviewFonts() {
  KEYCAP_LEGEND_FONTS.forEach((font) => {
    void ensureLegendFontPreviewLoaded(font);
  });
}

function buildLegendFontPreviewStyle(font) {
  if (!font?.measurementFamily) {
    return "";
  }

  return `font-family: "${font.measurementFamily}", "Hiragino Sans", "Yu Gothic UI", sans-serif; font-style: normal; font-weight: ${font.cssWeight ?? 400};`;
}

function getLegendFontMetaLabel(font) {
  return font?.fontKind === "variable" ? "Variable / named style" : "Static face";
}

function getLegendFontAttributionText(font) {
  const lines = Array.isArray(font?.requiredAttributionLines) ? font.requiredAttributionLines : [];
  return lines.join("\n");
}

function renderLegendFontAttributionCard(font) {
  const attributionText = getLegendFontAttributionText(font);
  if (!attributionText) {
    return "";
  }

  const isCopied = state.copiedFontAttributionKey === font.key;
  return `
    <span class="note-card font-attribution-card">
      <span class="font-attribution-card__header">
        <strong>著作権・ライセンス表記</strong>
        <button
          class="font-attribution-card__copy"
          type="button"
          data-copy-font-attribution="${font.key}"
        >
          ${isCopied ? "コピー済み" : "コピー"}
        </button>
      </span>
      <pre class="font-attribution-card__body">${escapeHtml(attributionText)}</pre>
    </span>
  `;
}

function renderLegendFontPickerOptions() {
  const matchingFonts = getLegendFontPickerResults();
  if (matchingFonts.length === 0) {
    return `<div class="font-picker-empty">一致するフォントがありません</div>`;
  }

  return matchingFonts
    .map((font) => {
      const isSelected = font.key === state.keycapParams.legendFontKey;
      const previewStyle = buildLegendFontPreviewStyle(font);
      const metaLabel = getLegendFontMetaLabel(font);

      return `
        <button
          class="font-picker-option ${isSelected ? "is-selected" : ""}"
          type="button"
          data-font-picker-option="${font.key}"
        >
          <span class="font-picker-option__preview" style="${escapeHtml(previewStyle)}">${escapeHtml(font.label)}</span>
          <span class="font-picker-meta-row">
            <span class="font-picker-option__meta">${escapeHtml(metaLabel)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderField(field) {
  const value = state.keycapParams[field.key];
  const fieldViewTransitionName = createViewTransitionName("field", field.key);
  const fieldLabel = resolveDynamicCopy(field.label);
  const fieldHint = resolveDynamicCopy(field.hint);
  const secondaryLabel = resolveDynamicCopy(field.secondaryLabel);
  const fieldOptions = resolveFieldOptions(field);
  const isDisabled = isFieldDisabled(field);

  if (field.type === "checkbox") {
    return `
      <label class="field field--checkbox" style="view-transition-name: ${fieldViewTransitionName};">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="checkbox-pill">
          <input type="checkbox" data-field="${field.key}" ${value ? "checked" : ""} />
          <span>${value ? "オン" : "オフ"}</span>
        </span>
      </label>
    `;
  }

  if (field.type === "font-search") {
    const selectedFont = resolveLegendFontConfig(value);
    const selectedFontLabel = selectedFont.label;
    const selectedPreviewStyle = buildLegendFontPreviewStyle(selectedFont);
    const selectedFontMetaLabel = getLegendFontMetaLabel(selectedFont);
    const selectedFontAttributionCard = renderLegendFontAttributionCard(selectedFont);
    const pickerId = `font-picker-${field.key}`;
    const isPickerOpen = state.legendFontPickerOpen;

    return `
      <label class="field field--font-search ${isPickerOpen ? "is-open" : ""}" style="view-transition-name: ${fieldViewTransitionName};">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="font-picker" data-font-picker>
          <span class="font-picker-trigger-shell">
            <span class="field-control font-picker-trigger">
              <span class="font-picker-selection">
                <span class="font-picker-selection__label" style="${escapeHtml(selectedPreviewStyle)}">${escapeHtml(selectedFontLabel)}</span>
                <span class="font-picker-meta-row">
                  <span class="font-picker-selection__meta">${escapeHtml(selectedFontMetaLabel)}</span>
                </span>
              </span>
              <button
                class="font-picker-search-button"
                type="button"
                data-font-picker-open="${field.key}"
                aria-expanded="${isPickerOpen ? "true" : "false"}"
                aria-controls="${pickerId}"
                aria-label="フォントを検索"
              >
                ${SEARCH_ICON_MARKUP}
              </button>
            </span>
            ${isPickerOpen ? `
              <span class="font-picker-popover" id="${pickerId}" role="dialog" aria-label="フォント検索">
                <label class="field-control font-picker-search-input">
                  <span class="font-picker-search-input__icon">${SEARCH_ICON_MARKUP}</span>
                  <input
                    type="text"
                    data-font-picker-query
                    value="${escapeHtml(state.legendFontPickerQuery)}"
                    placeholder="フォント名で検索"
                    spellcheck="false"
                    autocomplete="off"
                  />
                </label>
                <span class="font-picker-options" data-font-picker-options>
                  ${renderLegendFontPickerOptions()}
                </span>
              </span>
            ` : ""}
          </span>
          ${selectedFontAttributionCard}
        </span>
      </label>
    `;
  }

  if (field.type === "select") {
    return `
      <label class="field" style="view-transition-name: ${fieldViewTransitionName};">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="field-control field-control--select">
          <select data-field="${field.key}" ${isDisabled ? "disabled" : ""}>
            ${fieldOptions
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
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
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
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
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
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="field-control-cluster">
          <span class="field-mini-control">
            <span class="field-mini-control__label">横幅</span>
            <span class="field-control">
              <input
                type="number"
                data-field="${field.key}"
                value="${formatNumericFieldValue(field.key, value)}"
                ${field.min != null ? `min="${field.min}"` : ""}
                ${field.max != null ? `max="${field.max}"` : ""}
                ${field.step != null ? `step="${field.step}"` : ""}
              />
              ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
            </span>
          </span>
          <span class="field-mini-control">
            <span class="field-mini-control__label">${secondaryLabel}</span>
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
        <span class="field-label">${fieldLabel}</span>
        <span class="field-hint">${fieldHint}</span>
      </span>
      <span class="field-control">
        <input
          type="number"
          data-field="${field.key}"
          value="${formatNumericFieldValue(field.key, value)}"
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
  const copyFontAttributionButton = getClosestFromEventTarget(event, "[data-copy-font-attribution]");
  if (copyFontAttributionButton) {
    void handleCopyLegendFontAttribution(copyFontAttributionButton.dataset.copyFontAttribution);
    return;
  }

  const fontPickerOptionButton = getClosestFromEventTarget(event, "[data-font-picker-option]");
  if (fontPickerOptionButton) {
    applyLegendFontSelection(resolveLegendFontConfig(fontPickerOptionButton.dataset.fontPickerOption), { closePicker: true });
    return;
  }

  const fontPickerOpenButton = getClosestFromEventTarget(event, "[data-font-picker-open]");
  if (fontPickerOpenButton) {
    if (state.legendFontPickerOpen) {
      closeLegendFontPicker();
    } else {
      openLegendFontPicker();
    }
    return;
  }

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

  const exportButton = getClosestFromEventTarget(event, "[data-export]");
  if (exportButton) {
    executeExport(exportButton.dataset.export);
  }
}

function handleInspectorCardInput(event) {
  const fontPickerQueryInput = getClosestFromEventTarget(event, "[data-font-picker-query]");
  if (fontPickerQueryInput) {
    handleLegendFontPickerQueryInput(fontPickerQueryInput);
    return;
  }

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

function handleInspectorCardKeydown(event) {
  const fontPickerQueryInput = getClosestFromEventTarget(event, "[data-font-picker-query]");
  if (!fontPickerQueryInput) {
    return;
  }

  if (event.key === "Escape") {
    closeLegendFontPicker();
    event.preventDefault();
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  const firstMatchingFont = getLegendFontPickerResults()[0];
  if (!firstMatchingFont) {
    return;
  }

  applyLegendFontSelection(firstMatchingFont, { closePicker: true });
  event.preventDefault();
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
    try {
      window.Coloris.updatePosition();
    } catch (error) {}
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

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {}
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function handleCopyLegendFontAttribution(fontKey) {
  const font = resolveLegendFontConfig(fontKey);
  const attributionText = getLegendFontAttributionText(font);
  if (!font || !attributionText) {
    return;
  }

  await copyTextToClipboard(attributionText);
  state.copiedFontAttributionKey = font.key;
  render();

  window.clearTimeout(fontAttributionCopyResetTimer);
  fontAttributionCopyResetTimer = window.setTimeout(() => {
    if (state.copiedFontAttributionKey !== font.key) {
      return;
    }

    state.copiedFontAttributionKey = "";
    render();
  }, 1600);
}

function applyLegendFontSelection(font, options = {}) {
  const { deferPreview = false, closePicker = false } = options;

  if (closePicker) {
    state.legendFontPickerOpen = false;
    state.legendFontPickerQuery = "";
  }

  if (!font || font.key === state.keycapParams.legendFontKey) {
    if (closePicker) {
      render();
    }
    return false;
  }

  state.keycapParams.legendFontKey = font.key;
  syncDerivedKeycapParams();
  state.editorStatus = "dirty";
  state.editorSummary = "入力内容を反映待ち";
  render({ animateInspector: true });

  if (!deferPreview) {
    schedulePreviewRefresh();
  }

  return true;
}

function openLegendFontPicker() {
  state.legendFontPickerOpen = true;
  state.legendFontPickerQuery = "";
  pendingLegendFontPickerFocus = true;
  render();
  warmLegendFontPreviewFonts();
}

function closeLegendFontPicker() {
  if (!state.legendFontPickerOpen) {
    return;
  }

  state.legendFontPickerOpen = false;
  state.legendFontPickerQuery = "";
  render();
}

function handleLegendFontPickerQueryInput(input) {
  state.legendFontPickerQuery = input.value;
  const options = app.querySelector("[data-font-picker-options]");
  if (options) {
    options.innerHTML = renderLegendFontPickerOptions();
  }
}

function handleWindowPointerDown(event) {
  if (!state.legendFontPickerOpen) {
    return;
  }

  if (event.target instanceof Element && event.target.closest("[data-font-picker]")) {
    return;
  }

  closeLegendFontPicker();
}

function handleWindowKeydown(event) {
  if (event.key !== "Escape" || !state.legendFontPickerOpen) {
    return;
  }

  closeLegendFontPicker();
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

  // Preserve hidden shape defaults as part of the editor state so profile switches
  // and JSON round-trips stay aligned with the shape JSON definitions.
  return Object.keys(defaults);
}

function sanitizeEditorParamValue(fieldKey, value, fallback, paramsContext = state.keycapParams) {
  const fieldConfig = fieldConfigByKey.get(fieldKey);

  if (fieldKey === SETTINGS_NAME_FIELD.key) {
    return sanitizeExportBaseName(value, fallback);
  }

  if (fieldKey === "legendFontKey") {
    return resolveLegendFontConfig(value).key;
  }

  if (fieldKey === "legendFontStyleKey") {
    const legendFontKey = resolveLegendFontConfig(paramsContext?.legendFontKey).key;
    const styleOptions = getLegendFontStyleFieldOptions({ legendFontKey });
    const allowedValues = new Set(styleOptions.map((option) => option.value));
    const fallbackValue = allowedValues.has(fallback) ? fallback : (styleOptions[0]?.value ?? LEGEND_FONT_STYLE_FALLBACK_KEY);
    return allowedValues.has(value) ? value : fallbackValue;
  }

  if (fieldKey === "legendOutlineDelta") {
    return clampLegendOutlineDelta(value, fallback);
  }

  if (fieldKey === "typewriterCornerRadius") {
    return clampTypewriterCornerRadius(value, fallback);
  }

  if (fieldKey === "rimWidth") {
    return clampTypewriterRimWidth(value, paramsContext, fallback);
  }

  if (fieldKey === "rimHeightUp" || fieldKey === "rimHeightDown") {
    return clampNonNegativeNumber(value, fallback);
  }

  if (colorFieldKeys.has(fieldKey)) {
    return normalizeHexColor(value) ?? fallback;
  }

  if (fieldConfig?.type === "select") {
    const allowedValues = new Set(resolveFieldOptions(fieldConfig).map((option) => option.value));
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
    exportableParams[key] = sanitizeEditorParamValue(key, params[key], defaults[key], params);
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
  return `${sanitizeExportBaseName(params.name)}.json`;
}

function build3mfFilename(params = state.keycapParams) {
  return `${sanitizeExportBaseName(params.name)}.3mf`;
}

function parseEditorDataPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("編集データ JSON の形式が不正です。");
  }

  if (payload.kind !== EDITOR_DATA_KIND && !LEGACY_EDITOR_DATA_KINDS.has(payload.kind)) {
    throw new Error("Keycap Maker の編集データ JSON ではありません。");
  }

  if (payload.schemaVersion !== EDITOR_DATA_SCHEMA_VERSION) {
    throw new Error(`未対応の編集データ schemaVersion です: ${payload.schemaVersion}`);
  }

  if (!payload.params || typeof payload.params !== "object" || Array.isArray(payload.params)) {
    throw new Error("編集データ JSON に params がありません。");
  }

  const rawProfileKey = payload.selectors?.shapeProfile ?? payload.params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  if (!SHAPE_PROFILE_MAP.has(rawProfileKey)) {
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
    nextParams[key] = sanitizeEditorParamValue(key, mergedRawParams[key], defaults[key], mergedRawParams);
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
  const previousGeometryType = resolveShapeGeometryType(state.keycapParams.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY);
  const nextGeometryType = resolveShapeGeometryType(profileKey);
  const geometryTypeChanged = previousGeometryType !== nextGeometryType;
  const nextParams = {};

  for (const key of listEditableParamKeys(profileKey)) {
    const sourceValue = geometryTypeChanged && GEOMETRY_TYPE_RESET_FIELDS.has(key)
      ? defaults[key]
      : state.keycapParams[key];
    nextParams[key] = sanitizeEditorParamValue(key, sourceValue, defaults[key], state.keycapParams);
  }

  nextParams.shapeProfile = profileKey;
  state.keycapParams = syncDerivedKeycapParams(nextParams);
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

const TOP_LIVE_FIELD_KEYS = new Set([
  "topCenterHeight",
  "topPitchDeg",
  "topRollDeg",
  "topFrontHeight",
  "topBackHeight",
  "topLeftHeight",
  "topRightHeight",
]);

function syncFieldHint(fieldKey) {
  const input = app.querySelector(`[data-field="${fieldKey}"]`);
  const fieldConfig = getFieldConfig(fieldKey);
  const hint = input?.closest(".field")?.querySelector(".field-hint");

  if (hint && fieldConfig) {
    hint.textContent = resolveDynamicCopy(fieldConfig.hint);
  }
}

function syncVisibleTopFieldState(activeField = null) {
  TOP_LIVE_FIELD_KEYS.forEach((fieldKey) => {
    const input = app.querySelector(`[data-field="${fieldKey}"]`);
    if (!input) {
      return;
    }

    if (fieldKey !== activeField) {
      input.value = formatNumericFieldValue(fieldKey, state.keycapParams[fieldKey]);
    }

    syncFieldHint(fieldKey);
  });
}

function isTopEdgeHeightField(field) {
  return field === "topFrontHeight"
    || field === "topBackHeight"
    || field === "topLeftHeight"
    || field === "topRightHeight";
}

function applyTopEdgeHeightChange(field, value) {
  const geometry = resolveTopPlaneGeometry(state.keycapParams);
  const centerHeight = geometry.topCenterHeight;

  if (field === "topFrontHeight" && Math.abs(geometry.topFront) > 1e-6) {
    state.keycapParams.topPitchDeg = atanDeg((value - centerHeight) / geometry.topFront);
    return;
  }

  if (field === "topBackHeight" && Math.abs(geometry.topBack) > 1e-6) {
    state.keycapParams.topPitchDeg = atanDeg((value - centerHeight) / geometry.topBack);
    return;
  }

  if (field === "topLeftHeight" && Math.abs(geometry.topLeft) > 1e-6) {
    state.keycapParams.topRollDeg = atanDeg((value - centerHeight) / geometry.topLeft);
    return;
  }

  if (field === "topRightHeight" && Math.abs(geometry.topRight) > 1e-6) {
    state.keycapParams.topRollDeg = atanDeg((value - centerHeight) / geometry.topRight);
  }
}

function handleFieldChange(event) {
  const field = event.currentTarget.dataset.field;
  const input = event.currentTarget;
  const deferPreview = event.deferPreview === true;
  const fieldConfig = getFieldConfig(field);
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
    const nextValue = Number(input.value);

    if (isTopEdgeHeightField(field)) {
      applyTopEdgeHeightChange(field, nextValue);
    } else {
      state.keycapParams[field] = nextValue;
    }

    if (field === "keyWidth") {
      syncLinkedShapeInputs("keyWidth");
    }
  }

  syncDerivedKeycapParams();

  if (
    TOP_LIVE_FIELD_KEYS.has(field)
    || field === "topScale"
    || field === "keyWidth"
    || field === "keyDepth"
  ) {
    syncVisibleTopFieldState(field);
  }

  if (input.type === "checkbox") {
    input.parentElement?.querySelector("span:last-child")?.replaceChildren(input.checked ? "オン" : "オフ");
  }

  state.editorStatus = "dirty";
  state.editorSummary = "入力内容を反映待ち";

  if (
    field === "legendEnabled"
    || field === "homingBarEnabled"
    || field === "rimEnabled"
    || field === "topSlopeInputMode"
    || EDITOR_SELECTOR_KEYS.includes(field)
  ) {
    render({ animateInspector: true });
  }

  if (!deferPreview && field !== "topSlopeInputMode") {
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
      ...(isTypewriterRimRenderable(state.keycapParams)
        ? [
            createColorLayerJob({
              name: "rim",
              exportTarget: "rim",
              outputPath: keycapRimPreviewPath,
              colorFieldKey: "rimColor",
            }),
          ]
        : []),
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
      downloadBlob(blob, build3mfFilename());

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
window.addEventListener("pointerdown", handleWindowPointerDown, true);
window.addEventListener("keydown", handleWindowKeydown);

executeKeycapPreview({ silent: true });

ensureColorisLoaded().catch((error) => {
  console.warn(error);
});
