import "./styles.css";
import {
  LOCALE_OPTIONS,
  getInitialLocale,
  normalizeLocale,
  setLocalePreference,
  translate,
} from "./i18n/index.js";
import keycapEditorProfiles, {
  createDefaultKeycapParams,
  DEFAULT_SHAPE_PROFILE_KEY,
  EDITOR_SELECTOR_KEYS,
  getShapeProfileFieldGroups,
  getShapeProfileFieldOverride,
  getShapeProfileGeometryDefaults,
  resolveShapeGeometryType,
} from "./data/keycap-shape-registry.js";
import { runOpenScad } from "./lib/openscad-client.js";
import { hexColorToNumber, normalizeHexColor } from "./lib/color-utils.js";
import {
  DEFAULT_EXPORT_BASE_NAME,
  createEditorDataPayload,
  createInitialKeycapParams,
  getTopSurfaceShapePreset,
  listEditableParamKeys,
  parseEditorDataPayload,
  resolveStemType,
  sanitizeEditorParamValue,
  sanitizeExportBaseName,
  syncDerivedKeycapParams,
} from "./lib/editor-data.js";
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
const keycapStlExportPath = "/outputs/keycap-single-material.stl";
const SIDE_LEGEND_CONFIGS = Object.freeze([
  {
    side: "front",
    paramPrefix: "sideLegendFront",
    exportTarget: "side_legend_front",
    outputPath: "/outputs/keycap-side-legend-front-preview.off",
    colorFieldKey: "sideLegendFrontColor",
  },
  {
    side: "back",
    paramPrefix: "sideLegendBack",
    exportTarget: "side_legend_back",
    outputPath: "/outputs/keycap-side-legend-back-preview.off",
    colorFieldKey: "sideLegendBackColor",
  },
  {
    side: "left",
    paramPrefix: "sideLegendLeft",
    exportTarget: "side_legend_left",
    outputPath: "/outputs/keycap-side-legend-left-preview.off",
    colorFieldKey: "sideLegendLeftColor",
  },
  {
    side: "right",
    paramPrefix: "sideLegendRight",
    exportTarget: "side_legend_right",
    outputPath: "/outputs/keycap-side-legend-right-preview.off",
    colorFieldKey: "sideLegendRightColor",
  },
]);
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
const GLOBE_ICON_MARKUP = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13.5 13.5 0 0 1 0 18" />
    <path d="M12 3a13.5 13.5 0 0 0 0 18" />
  </svg>
`;
const EXPORT_ICON_MARKUP = Object.freeze({
  file: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  `,
  package: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  `,
  download: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  `,
});
const PARAMETER_GROUP_ICON_PATHS = Object.freeze({
  name: "icons/parameters/name.svg",
  shape: "icons/parameters/shape.svg",
  top: "icons/parameters/top.svg",
  legend: "icons/parameters/legend.svg",
  homing: "icons/parameters/homing.svg",
  stem: "icons/parameters/stem.svg",
});
const KEY_UNIT_BASIS_ICON_PATH = "icons/parameters/key-unit-basis.svg?v=rough-a";
const KEY_DEPTH_BASIS_ICON_PATH = "icons/parameters/key-depth-basis.svg?v=rough-b";
const KEY_WALL_THICKNESS_ICON_PATH = "icons/parameters/key-wall-thickness.svg?v=rough-a";
const KEY_TOP_TAPER_ICON_PATH = "icons/parameters/key-top-taper.svg?v=rough-a";
const PARAMETER_GROUP_CAPTION_KEYS = Object.freeze({
  name: "parameterGroupCaptions.name",
  top: "parameterGroupCaptions.top",
  legend: "parameterGroupCaptions.legend",
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
let fontAttributionCopyResetTimer = 0;
const legendFontPreviewPromises = new Map();
let pendingLegendFontPickerFocus = false;
const textDecoder = new TextDecoder();
const supportsUiViewTransitions = typeof document.startViewTransition === "function";
const reduceMotionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
const DEFAULT_KEY_UNIT_MM = 18;
const KEY_UNIT_MIN_MM = 1;
const KEY_UNIT_STORAGE_KEY = "keycap-maker:key-unit-mm";
const KEY_UNIT_FIELD_KEY = "keyUnitMm";
const LEGEND_MIN_SIZE = 0.5;
const LEGEND_OUTLINE_MIN = -1.2;
const LEGEND_OUTLINE_MAX = 1.2;
const LEGEND_FONT_STYLE_FALLBACK_KEY = "font-default";
const LEGEND_FIELD_SUFFIXES = Object.freeze({
  enabled: "Enabled",
  color: "Color",
  text: "Text",
  fontKey: "FontKey",
  fontStyleKey: "FontStyleKey",
  underlineEnabled: "UnderlineEnabled",
  size: "Size",
  outlineDelta: "OutlineDelta",
  height: "Height",
  embed: "Embed",
  offsetX: "OffsetX",
  offsetY: "OffsetY",
});
function createLegendFieldKeys(paramPrefix, { side = null } = {}) {
  const isSideLegend = side != null;
  const keys = [
    LEGEND_FIELD_SUFFIXES.enabled,
    LEGEND_FIELD_SUFFIXES.color,
    LEGEND_FIELD_SUFFIXES.text,
    LEGEND_FIELD_SUFFIXES.fontKey,
    LEGEND_FIELD_SUFFIXES.fontStyleKey,
    LEGEND_FIELD_SUFFIXES.underlineEnabled,
    LEGEND_FIELD_SUFFIXES.size,
    LEGEND_FIELD_SUFFIXES.outlineDelta,
    LEGEND_FIELD_SUFFIXES.height,
    ...(!isSideLegend ? [LEGEND_FIELD_SUFFIXES.embed] : []),
    LEGEND_FIELD_SUFFIXES.offsetX,
    LEGEND_FIELD_SUFFIXES.offsetY,
  ];

  return Object.freeze(keys.map((suffix) => legendParamKey(paramPrefix, suffix)));
}

const LEGEND_CARD_DEFINITIONS = Object.freeze([
  {
    id: "legend-card-keytop",
    title: () => t("legendCards.keytop"),
    fieldKeys: createLegendFieldKeys("legend"),
  },
  ...SIDE_LEGEND_CONFIGS.map((config) => ({
    id: `legend-card-${config.side}`,
    title: () => t("legendCards.sidewall", { side: getSideLegendLabel(config.side) }),
    fieldKeys: createLegendFieldKeys(config.paramPrefix, { side: config.side }),
  })),
]);
const TYPEWRITER_MIN_STEM_HEIGHT = 0.6;
const TYPEWRITER_STEM_MOUNT_OVERLAP = 0.02;
const TOP_HAT_MIN_SIZE = 0.2;
const TOP_HAT_MIN_HEIGHT = 0.05;
const TOP_HAT_MIN_SHOULDER_ANGLE = 5;
const TOP_HAT_MAX_SHOULDER_ANGLE = 85;
const TOP_HAT_MIN_SHOULDER_RADIUS = 0;
const TOP_HAT_EDGE_CLEARANCE = 0.2;
const TOP_HAT_RECESS_CLEARANCE = 0.05;
const LINKED_SIZE_UNIT_FIELDS = Object.freeze({
  keySizeUnits: "keyWidth",
  keyDepthUnits: "keyDepth",
  topHatTopWidthUnits: "topHatTopWidth",
  topHatTopDepthUnits: "topHatTopDepth",
});
const COLORIS_STYLE_PATH = "vendor/coloris/coloris.min.css";
const COLORIS_SCRIPT_PATH = "vendor/coloris/coloris.min.js";
const DEFAULT_KEYCAP_COLORS = Object.freeze({
  bodyColor: "#f8f9fa",
  rimColor: "#d8ccb8",
  legendColor: "#212529",
  sideLegendFrontColor: "#212529",
  sideLegendBackColor: "#212529",
  sideLegendLeftColor: "#212529",
  sideLegendRightColor: "#212529",
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

const workspaceSections = [
  {
    id: "params",
    labelKey: "navigation.settings",
  },
  {
    id: "export",
    labelKey: "navigation.export",
  },
];

function t(key, values = {}, fallback = key) {
  return translate(state.locale, key, values, fallback);
}

function legendParamKey(prefix, suffix) {
  return `${prefix}${suffix}`;
}

function sanitizeKeyUnitMm(value, fallback = DEFAULT_KEY_UNIT_MM) {
  const nextValue = Number(value);
  const fallbackValue = Number(fallback);
  const resolvedFallback = Number.isFinite(fallbackValue) && fallbackValue >= KEY_UNIT_MIN_MM
    ? fallbackValue
    : DEFAULT_KEY_UNIT_MM;

  return Number.isFinite(nextValue) && nextValue >= KEY_UNIT_MIN_MM
    ? nextValue
    : resolvedFallback;
}

function readKeyUnitMmPreference() {
  try {
    return sanitizeKeyUnitMm(window.localStorage?.getItem(KEY_UNIT_STORAGE_KEY));
  } catch {
    return DEFAULT_KEY_UNIT_MM;
  }
}

function saveKeyUnitMmPreference(value) {
  try {
    window.localStorage?.setItem(KEY_UNIT_STORAGE_KEY, `${sanitizeKeyUnitMm(value)}`);
  } catch {}
}

function getKeyUnitMm() {
  return sanitizeKeyUnitMm(state?.keyUnitMm);
}

function formatCompactNumber(value, digits = 2) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return "";
  }

  return nextValue.toFixed(digits).replace(/\.?0+$/, "");
}

function formatKeyUnitMmValue(value = getKeyUnitMm()) {
  return formatCompactNumber(value, 2);
}

function formatKeyUnitMmInputValue(value = getKeyUnitMm()) {
  return formatCompactNumber(value, 2);
}

function getKeyUnitCopyValues() {
  return {
    unitBase: formatKeyUnitMmValue(),
  };
}

function getWorkspaceSectionLabel(section) {
  return t(section.labelKey, {}, section.id);
}

function getShapeProfileOptions() {
  return keycapEditorProfiles.profiles.map((profile) => ({
    value: profile.key,
    label: t(`shapeProfiles.${profile.key}.label`, {}, profile.label),
  }));
}

function localizeFieldOption(fieldKey, option) {
  return {
    ...option,
    label: option.labelKey
      ? t(option.labelKey, {}, option.label ?? option.value)
      : t(`options.${fieldKey}.${option.value}`, {}, option.label ?? option.value),
  };
}

function isTypewriterShapeProfile(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const geometryType = resolveShapeGeometryType(profileKey);
  return geometryType === "typewriter" || geometryType === "typewriter_jis_enter";
}

function isJisEnterShapeProfile(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const geometryType = resolveShapeGeometryType(profileKey);
  return geometryType === "jis_enter" || geometryType === "typewriter_jis_enter";
}

function isJisEnterTopHatShapeProfile(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return resolveShapeGeometryType(profileKey) === "jis_enter";
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

function getLegendFontFieldHint(params, fontFieldKey = "legendFontKey") {
  const selectedFont = resolveLegendFontConfig(params[fontFieldKey]);
  return selectedFont.fontKind === "variable"
    ? t("fields.legendFontKey.variableHint")
    : t("fields.legendFontKey.staticHint");
}

function getLegendFontStyleFieldOptions(params = state.keycapParams, fontFieldKey = "legendFontKey") {
  const nativeStyleOptions = getKeycapLegendFontStyleOptions(params[fontFieldKey]);
  if (nativeStyleOptions.length === 0) {
    return [{ value: LEGEND_FONT_STYLE_FALLBACK_KEY, label: t("font.defaultStyleLabel") }];
  }

  return nativeStyleOptions.map((option) => ({
    value: option.key,
    label: option.label,
  }));
}

function isLegendFontStyleSelectable(params = state.keycapParams, fontFieldKey = "legendFontKey") {
  return getKeycapLegendFontStyleOptions(params[fontFieldKey]).length > 0;
}

function getLegendFontStyleHint(params, fontFieldKey = "legendFontKey") {
  return isLegendFontStyleSelectable(params, fontFieldKey)
    ? t("fields.legendFontStyleKey.selectableHint")
    : t("fields.legendFontStyleKey.defaultHint");
}

function clampTypewriterCornerRadius(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.max(Number(fallback) || 0, 0);
  }

  return Math.max(nextValue, 0);
}

function getJisEnterFootprintLimits(params = state.keycapParams) {
  const keyWidth = Math.max(Number(params.keyWidth ?? 0), 0);
  const keyDepth = Math.max(Number(params.keyDepth ?? 0), 0);
  const notchWidth = Math.min(Math.max(Number(params.jisEnterNotchWidth ?? 0), 0), Math.max(keyWidth - 0.2, 0));
  const notchDepth = Math.min(Math.max(Number(params.jisEnterNotchDepth ?? 0), 0), Math.max(keyDepth - 0.2, 0));

  return {
    keyWidth,
    keyDepth,
    notchWidth,
    notchDepth,
    lowerBodyWidth: Math.max(keyWidth - notchWidth, 0),
    upperBodyDepth: Math.max(keyDepth - notchDepth, 0),
  };
}

function getTypewriterCornerRadiusMax(params = state.keycapParams) {
  if (isJisEnterShapeProfile(params.shapeProfile)) {
    const limits = getJisEnterFootprintLimits(params);
    return Math.max(Math.min(
      limits.keyWidth,
      limits.keyDepth,
      limits.lowerBodyWidth,
      limits.upperBodyDepth,
    ) / 2, 0);
  }

  return Math.max(Math.min(Number(params.keyWidth ?? 0), Number(params.keyDepth ?? 0)) / 2, 0);
}

function getTypewriterCornerRadiusHint(params) {
  const maxRadius = getTypewriterCornerRadiusMax(params);
  return t("fields.typewriterCornerRadius.hint", { maxRadius: formatMillimeter(maxRadius) });
}

function clampNonNegativeNumber(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.max(Number(fallback) || 0, 0);
  }

  return Math.max(nextValue, 0);
}

function getTypewriterRimMaxWidth(params = state.keycapParams) {
  if (isJisEnterShapeProfile(params.shapeProfile)) {
    const limits = getJisEnterFootprintLimits(params);
    return Math.max(Math.min(
      limits.keyWidth,
      limits.keyDepth,
      limits.lowerBodyWidth,
      limits.upperBodyDepth,
    ) / 2, 0);
  }

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
  return t("fields.rimWidth.hint", { maxWidth: formatMillimeter(maxWidth) });
}

function getTypewriterRimHeightUpHint() {
  return t("fields.rimHeightUp.hint");
}

function getTypewriterRimHeightDownHint() {
  return t("fields.rimHeightDown.hint");
}

function getJisEnterNotchWidthHint(params) {
  const maxWidth = Math.max(Number(params.keyWidth ?? 0) - 0.2, 0);
  return t("fields.jisEnterNotchWidth.hint", { maxWidth: formatMillimeter(maxWidth) });
}

function getJisEnterNotchDepthHint(params) {
  const maxDepth = Math.max(Number(params.keyDepth ?? 0) - 0.2, 0);
  return t("fields.jisEnterNotchDepth.hint", { maxDepth: formatMillimeter(maxDepth) });
}

function getTypewriterMountHeightMinimum(params = state.keycapParams) {
  const topCenterHeight = clampMinimum(params.topCenterHeight, 5.2, 0.1);
  return topCenterHeight + TYPEWRITER_MIN_STEM_HEIGHT - TYPEWRITER_STEM_MOUNT_OVERLAP;
}

function getTypewriterMountHeightHint(params) {
  return t("fields.typewriterMountHeight.hint", {
    minHeight: formatMillimeter(getTypewriterMountHeightMinimum(params)),
  });
}

function clampLegendOutlineDelta(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return Math.min(Math.max(nextValue, LEGEND_OUTLINE_MIN), LEGEND_OUTLINE_MAX);
}

function getLegendOutlineHint() {
  return t("fields.legendOutlineDelta.hint");
}

const STEM_TYPE_OPTIONS = Object.freeze([
  { value: "none", labelKey: "options.stemType.none" },
  { value: "mx", labelKey: "options.stemType.mx" },
  { value: "choc_v1", labelKey: "options.stemType.choc_v1" },
  { value: "choc_v2", labelKey: "options.stemType.choc_v2" },
  { value: "alps", labelKey: "options.stemType.alps" },
]);
const TOP_SURFACE_SHAPE_OPTIONS = Object.freeze([
  { value: "flat", labelKey: "options.topSurfaceShape.flat" },
  { value: "cylindrical", labelKey: "options.topSurfaceShape.cylindrical" },
  { value: "spherical", labelKey: "options.topSurfaceShape.spherical" },
]);
const CROSS_COMPATIBLE_STEM_TYPES = new Set(["mx", "choc_v2"]);
const SETTINGS_NAME_FIELD = Object.freeze({
  key: "name",
  label: () => t("fields.name.label"),
  hint: () => t("fields.name.hint"),
  type: "text",
  maxLength: 80,
  placeholder: DEFAULT_EXPORT_BASE_NAME,
});
const GEOMETRY_TYPE_RESET_FIELDS = new Set([
  "topCenterHeight",
  "topScale",
  "topSurfaceShape",
  "dishRadius",
  "dishDepth",
  "typewriterCornerRadius",
  "typewriterMountHeight",
]);
const FOOTPRINT_RESET_FIELDS = new Set([
  "keyWidth",
  "keyDepth",
  "jisEnterNotchWidth",
  "jisEnterNotchDepth",
]);

function isCrossCompatibleStemType(stemType) {
  return CROSS_COMPATIBLE_STEM_TYPES.has(stemType);
}

function getStemGroupDescription(params) {
  const stemType = resolveStemType(params);

  switch (stemType) {
    case "none":
      return t("stemDescriptions.none");
    case "mx":
      return t("stemDescriptions.mx");
    case "choc_v1":
      return t("stemDescriptions.choc_v1");
    case "alps":
      return t("stemDescriptions.alps");
    default:
      return t("stemDescriptions.choc_v2");
  }
}

function getStemOuterHint(params) {
  return resolveStemType(params) === "mx"
    ? t("fields.stemOuterDelta.hint")
    : t("fields.stemOuterDelta.hint");
}

function getStemFitHint(params) {
  switch (resolveStemType(params)) {
    case "mx":
    case "choc_v2":
      return t("fields.stemCrossMargin.mxHint");
    case "choc_v1":
      return t("fields.stemCrossMargin.chocV1Hint");
    case "alps":
      return t("fields.stemCrossMargin.alpsHint");
    default:
      return t("fields.stemCrossMargin.disabledHint");
  }
}

function getStemInsetHint(params) {
  return resolveStemType(params) === "none"
    ? t("fields.stemInsetDelta.disabledHint")
    : t("fields.stemInsetDelta.hint");
}

const TOP_SLOPE_INPUT_MODE_OPTIONS = Object.freeze([
  { value: "angle", labelKey: "options.topSlopeInputMode.angle" },
  { value: "edge-height", labelKey: "options.topSlopeInputMode.edge-height" },
]);

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

function clampTopScale(value, fallback = 1) {
  const nextValue = Number(value);
  const fallbackValue = Number(fallback);
  const resolvedFallback = Number.isFinite(fallbackValue) ? fallbackValue : 1;
  return Math.min(Math.max(Number.isFinite(nextValue) ? nextValue : resolvedFallback, 0.5), 1);
}

function resolveTopScaleAngle(size, topCenterHeight, topScale) {
  const inset = Math.max(Number(size) * (1 - topScale) / 2, 0);
  return atanDeg(inset / Math.max(topCenterHeight, 0.1));
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

  if (isTypewriterShapeProfile(profileKey)) {
    return {
      front: 0,
      back: 0,
      left: 0,
      right: 0,
      topThickness: geometryDefaults.topThickness,
    };
  }

  const keyWidth = clampMinimum(params.keyWidth, defaults.keyWidth ?? 18, 1);
  const keyDepth = clampMinimum(params.keyDepth, defaults.keyDepth ?? 18, 1);
  const topCenterHeight = clampMinimum(params.topCenterHeight, defaults.topCenterHeight ?? 9.5, 0.1);
  const topScale = clampTopScale(params.topScale, defaults.topScale ?? 1);
  const horizontalAngle = resolveTopScaleAngle(keyWidth, topCenterHeight, topScale);
  const verticalAngle = resolveTopScaleAngle(keyDepth, topCenterHeight, topScale);

  return {
    front: verticalAngle,
    back: verticalAngle,
    left: horizontalAngle,
    right: horizontalAngle,
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
  const topSurfaceShape = params.topSurfaceShape ?? "flat";
  const rawDishDepth = Number(params.dishDepth ?? 0);
  const activeDishDepth = topSurfaceShape === "flat" || !Number.isFinite(rawDishDepth) ? 0 : rawDishDepth;

  return {
    topFrontHeight: geometry.topCenterHeight + geometry.topFront * pitchSlope,
    topBackHeight: geometry.topCenterHeight + geometry.topBack * pitchSlope,
    topLeftHeight: geometry.topCenterHeight + geometry.topLeft * rollSlope,
    topRightHeight: geometry.topCenterHeight + geometry.topRight * rollSlope,
    topVisibleCenterHeight: geometry.topCenterHeight - activeDishDepth,
  };
}

function getTopCenterHeightHint(params) {
  if (isTypewriterShapeProfile(params.shapeProfile)) {
    return t("fields.topCenterHeight.typewriterHint");
  }

  return t("fields.topCenterHeight.hint", { height: formatMillimeter(params.topVisibleCenterHeight) });
}

function getTopPitchHint(params) {
  return t("fields.topPitchDeg.hint", {
    front: formatMillimeter(params.topFrontHeight),
    back: formatMillimeter(params.topBackHeight),
  });
}

function getTopRollHint(params) {
  return t("fields.topRollDeg.hint", {
    left: formatMillimeter(params.topLeftHeight),
    right: formatMillimeter(params.topRightHeight),
  });
}

function getTopFrontHeightHint(params) {
  return t("fields.topFrontHeight.hint", { pitch: formatDegree(params.topPitchDeg) });
}

function getTopBackHeightHint(params) {
  return t("fields.topBackHeight.hint", { pitch: formatDegree(params.topPitchDeg) });
}

function getTopLeftHeightHint(params) {
  return t("fields.topLeftHeight.hint", { roll: formatDegree(params.topRollDeg) });
}

function getTopRightHeightHint(params) {
  return t("fields.topRightHeight.hint", { roll: formatDegree(params.topRollDeg) });
}

function getTopSurfaceShapeHint() {
  return t("fields.topSurfaceShape.hint");
}

function getDishDepthHint(params) {
  if (params.topSurfaceShape === "cylindrical") {
    return t("fields.dishDepth.cylindricalHint");
  }

  if (params.topSurfaceShape === "spherical") {
    return t("fields.dishDepth.sphericalHint");
  }

  return t("fields.dishDepth.flatHint");
}

function getTopHatFootprintLimits(params = state.keycapParams) {
  const geometry = resolveTopPlaneGeometry(params);
  return {
    width: Math.max(geometry.topRight - geometry.topLeft, TOP_HAT_MIN_SIZE),
    depth: Math.max(geometry.topBack - geometry.topFront, TOP_HAT_MIN_SIZE),
  };
}

function getTopHatUsableFootprintLimits(params = state.keycapParams) {
  const limits = getTopHatFootprintLimits(params);
  return {
    width: Math.max(limits.width - TOP_HAT_EDGE_CLEARANCE * 2, TOP_HAT_MIN_SIZE),
    depth: Math.max(limits.depth - TOP_HAT_EDGE_CLEARANCE * 2, TOP_HAT_MIN_SIZE),
  };
}

function getJisEnterTopHatInsetMax(params = state.keycapParams) {
  const limits = getTopHatFootprintLimits(params);
  const notchWidth = Math.min(Math.max(Number(params.jisEnterNotchWidth ?? 0), 0), Math.max(limits.width - TOP_HAT_MIN_SIZE, 0));
  const notchDepth = Math.min(Math.max(Number(params.jisEnterNotchDepth ?? 0), 0), Math.max(limits.depth - TOP_HAT_MIN_SIZE, 0));
  const lowerWidth = Math.max(limits.width - notchWidth, 0);
  const upperDepth = Math.max(limits.depth - notchDepth, 0);
  return Math.max(Math.min(
    (limits.width - TOP_HAT_MIN_SIZE) / 2,
    (limits.depth - TOP_HAT_MIN_SIZE) / 2,
    (lowerWidth - TOP_HAT_MIN_SIZE) / 2,
    (upperDepth - TOP_HAT_MIN_SIZE) / 2,
  ), 0);
}

function getTopHatSafeShoulderAngle(params = state.keycapParams) {
  const angle = Number(params.topHatShoulderAngle ?? 45);
  return Math.min(Math.max(Number.isFinite(angle) ? angle : 45, TOP_HAT_MIN_SHOULDER_ANGLE), TOP_HAT_MAX_SHOULDER_ANGLE);
}

function getTopHatSafeInset(params = state.keycapParams) {
  const inset = Number(params.topHatInset ?? 0);
  return Math.min(Math.max(Number.isFinite(inset) ? inset : 0, 0), getJisEnterTopHatInsetMax(params));
}

function getTopHatShoulderOutset(params = state.keycapParams) {
  if (isJisEnterTopHatShapeProfile(params.shapeProfile) && "topHatInset" in params) {
    return getTopHatSafeInset(params);
  }

  const limits = getTopHatUsableFootprintLimits(params);
  const topWidth = Math.min(Math.max(Number(params.topHatTopWidth ?? TOP_HAT_MIN_SIZE), TOP_HAT_MIN_SIZE), limits.width);
  const topDepth = Math.min(Math.max(Number(params.topHatTopDepth ?? TOP_HAT_MIN_SIZE), TOP_HAT_MIN_SIZE), limits.depth);
  return Math.min(
    Math.max((limits.width - topWidth) / 2, 0),
    Math.max((limits.depth - topDepth) / 2, 0),
  );
}

function getTopHatActualShoulderOutset(params = state.keycapParams) {
  const rawHeight = Number(params.topHatHeight ?? TOP_HAT_MIN_HEIGHT);
  const height = Math.abs(Number.isFinite(rawHeight) ? rawHeight : TOP_HAT_MIN_HEIGHT);
  const shoulderAngle = getTopHatSafeShoulderAngle(params);
  return Math.min(getTopHatShoulderOutset(params), height / Math.tan((shoulderAngle * Math.PI) / 180));
}

function getTopHatHeightMax(params = state.keycapParams) {
  const availableOutset = getTopHatShoulderOutset(params);
  const maxHeight = availableOutset * Math.tan((getTopHatSafeShoulderAngle(params) * Math.PI) / 180);

  return Math.max(maxHeight, TOP_HAT_MIN_HEIGHT);
}

function getTopHatHeightMin(params = state.keycapParams) {
  const geometry = resolveTopPlaneGeometry(params);
  return -Math.max(Number(geometry.topThickness ?? 0) - TOP_HAT_RECESS_CLEARANCE, 0);
}

function getTopHatTopRadiusMax(params = state.keycapParams) {
  if (isJisEnterTopHatShapeProfile(params.shapeProfile) && "topHatInset" in params) {
    const limits = getTopHatFootprintLimits(params);
    const inset = getTopHatSafeInset(params);
    const width = Math.max(limits.width - inset * 2, TOP_HAT_MIN_SIZE);
    const depth = Math.max(limits.depth - inset * 2, TOP_HAT_MIN_SIZE);
    const notchWidth = Math.min(Math.max(Number(params.jisEnterNotchWidth ?? 0), 0), Math.max(width - TOP_HAT_MIN_SIZE, 0));
    const notchDepth = Math.min(Math.max(Number(params.jisEnterNotchDepth ?? 0), 0), Math.max(depth - TOP_HAT_MIN_SIZE, 0));
    const lowerWidth = Math.max(width - notchWidth, TOP_HAT_MIN_SIZE);
    const upperDepth = Math.max(depth - notchDepth, TOP_HAT_MIN_SIZE);
    return Math.max(Math.min(width, depth, lowerWidth, upperDepth, notchWidth || width, notchDepth || depth) / 2, 0);
  }

  const width = Math.min(Math.max(Number(params.topHatTopWidth ?? 0), 0), getTopHatUsableFootprintLimits(params).width);
  const depth = Math.min(Math.max(Number(params.topHatTopDepth ?? 0), 0), getTopHatUsableFootprintLimits(params).depth);
  return Math.max(Math.min(width, depth) / 2, 0);
}

function getTopHatShoulderRadiusMax(params = state.keycapParams) {
  const rawHeight = Number(params.topHatHeight ?? 0);
  const height = Math.abs(Number.isFinite(rawHeight) ? rawHeight : 0);
  return Math.max(Math.min(height, getTopHatActualShoulderOutset(params)), TOP_HAT_MIN_SHOULDER_RADIUS);
}

function getTopHatShoulderRadiusMin(params = state.keycapParams) {
  return -getTopHatShoulderRadiusMax(params);
}

function getTopHatTopWidthHint(params) {
  const limits = getTopHatUsableFootprintLimits(params);
  return t("fields.topHatTopWidth.hint", { maxWidth: formatMillimeter(limits.width) });
}

function getTopHatTopDepthHint(params) {
  const limits = getTopHatUsableFootprintLimits(params);
  return t("fields.topHatTopDepth.hint", { maxDepth: formatMillimeter(limits.depth) });
}

function getTopHatInsetHint(params) {
  return t("fields.topHatInset.hint", { maxInset: formatMillimeter(getJisEnterTopHatInsetMax(params)) });
}

function getTopHatTopRadiusHint(params) {
  return t("fields.topHatTopRadius.hint", { maxRadius: formatMillimeter(getTopHatTopRadiusMax(params)) });
}

function getTopHatHeightHint(params) {
  return t("fields.topHatHeight.hint", {
    minHeight: formatMillimeter(getTopHatHeightMin(params), 2),
    maxHeight: formatMillimeter(getTopHatHeightMax(params), 2),
  });
}

function getTopHatShoulderRadiusHint(params) {
  return t("fields.topHatShoulderRadius.hint", {
    minRadius: formatMillimeter(getTopHatShoulderRadiusMin(params)),
    maxRadius: formatMillimeter(getTopHatShoulderRadiusMax(params)),
  });
}

function getSideLegendLabel(side) {
  return t(`sideLabels.${side}`, {}, side);
}

function createLegendControlFields({ paramPrefix, side = null, collapseControlled = false }) {
  const isSideLegend = side != null;
  const sideLabel = () => getSideLegendLabel(side);
  const enabledKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.enabled);
  const colorKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.color);
  const textKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.text);
  const fontKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.fontKey);
  const fontStyleKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.fontStyleKey);
  const underlineEnabledKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.underlineEnabled);
  const sizeKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.size);
  const outlineDeltaKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.outlineDelta);
  const heightKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.height);
  const embedKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.embed);
  const offsetXKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.offsetX);
  const offsetYKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.offsetY);
  const visibilityConfig = collapseControlled ? {} : { visibleWhen: (params) => params[enabledKey] };
  const sideValues = () => ({ side: sideLabel() });
  const fieldKey = (genericKey, topKey) => (isSideLegend ? `fields.sideLegend.${genericKey}` : `fields.${topKey}`);
  const enabledDependentFieldKeys = collapseControlled ? [] : [
    colorKey,
    textKey,
    fontKey,
    sizeKey,
    outlineDeltaKey,
    heightKey,
    ...(isSideLegend ? [] : [embedKey]),
    offsetXKey,
    offsetYKey,
  ];

  return [
    {
      key: enabledKey,
      label: () => (isSideLegend ? t("fields.sideLegend.enabled.label", sideValues()) : t("fields.legendEnabled.label")),
      hint: () => (isSideLegend ? t("fields.sideLegend.enabled.hint", sideValues()) : t("fields.legendEnabled.hint")),
      note: collapseControlled ? null : () => t("fields.legendPrintNotice"),
      type: "checkbox",
      dependentFieldKeys: enabledDependentFieldKeys,
    },
    {
      key: colorKey,
      label: () => t(fieldKey("color.label", "legendColor.label"), sideValues()),
      hint: () => t(fieldKey("color.hint", "legendColor.hint"), sideValues()),
      type: "color",
      placeholder: DEFAULT_KEYCAP_COLORS[colorKey] ?? DEFAULT_KEYCAP_COLORS.legendColor,
      ...visibilityConfig,
    },
    {
      key: textKey,
      label: () => t(fieldKey("text.label", "legendText.label"), sideValues()),
      hint: () => t(fieldKey("text.hint", "legendText.hint"), sideValues()),
      type: "text",
      maxLength: 24,
      placeholder: () => t("fields.legendText.placeholder"),
      ...visibilityConfig,
    },
    {
      key: fontKey,
      label: () => t(fieldKey("fontKey.label", "legendFontKey.label"), sideValues()),
      hint: (params) => getLegendFontFieldHint(params, fontKey),
      type: "font-search",
      dependentFieldKeys: [fontStyleKey, underlineEnabledKey],
      ...visibilityConfig,
    },
    {
      key: fontStyleKey,
      label: () => t(fieldKey("fontStyleKey.label", "legendFontStyleKey.label"), sideValues()),
      hint: (params) => getLegendFontStyleHint(params, fontKey),
      type: "select",
      options: (params) => getLegendFontStyleFieldOptions(params, fontKey),
      disabledWhen: (params) => !isLegendFontStyleSelectable(params, fontKey),
      ...visibilityConfig,
    },
    {
      key: underlineEnabledKey,
      label: () => t(fieldKey("underlineEnabled.label", "legendUnderlineEnabled.label"), sideValues()),
      hint: () => t(fieldKey("underlineEnabled.hint", "legendUnderlineEnabled.hint"), sideValues()),
      type: "checkbox",
      ...visibilityConfig,
    },
    {
      key: sizeKey,
      label: () => t(fieldKey("size.label", "legendSize.label"), sideValues()),
      hint: () => t(fieldKey("size.hint", "legendSize.hint"), sideValues()),
      unit: "mm",
      step: 0.1,
      min: LEGEND_MIN_SIZE,
      dependentFieldKeys: [outlineDeltaKey],
      ...visibilityConfig,
    },
    {
      key: outlineDeltaKey,
      label: () => t(fieldKey("outlineDelta.label", "legendOutlineDelta.label"), sideValues()),
      hint: () => getLegendOutlineHint(),
      unit: "mm",
      step: 0.02,
      min: LEGEND_OUTLINE_MIN,
      max: LEGEND_OUTLINE_MAX,
      ...visibilityConfig,
    },
    {
      key: heightKey,
      label: () => t(fieldKey("height.label", "legendHeight.label"), sideValues()),
      hint: () => t(fieldKey("height.hint", "legendHeight.hint"), sideValues()),
      unit: "mm",
      step: 0.05,
      min: 0,
      dependentFieldKeys: isSideLegend ? [] : [embedKey],
      ...visibilityConfig,
    },
    ...(!isSideLegend ? [{
      key: embedKey,
      label: () => t(fieldKey("embed.label", "legendEmbed.label"), sideValues()),
      hint: () => t(fieldKey("embed.hint", "legendEmbed.hint"), sideValues()),
      unit: "mm",
      step: 0.05,
      min: 0,
      ...visibilityConfig,
    }] : []),
    {
      key: offsetXKey,
      label: () => t(fieldKey("offsetX.label", "legendOffsetX.label"), sideValues()),
      hint: () => t(fieldKey("offsetX.hint", "legendOffsetX.hint"), sideValues()),
      unit: "mm",
      step: 0.1,
      dependentFieldKeys: [offsetYKey],
      ...visibilityConfig,
    },
    {
      key: offsetYKey,
      label: () => t(fieldKey("offsetY.label", "legendOffsetY.label"), sideValues()),
      hint: () => t(fieldKey("offsetY.hint", "legendOffsetY.hint"), sideValues()),
      unit: "mm",
      step: 0.1,
      ...visibilityConfig,
    },
  ];
}

const fieldGroupTemplates = [
  {
    id: "shape",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.shape.title"),
    description: (params) => (
      isTypewriterShapeProfile(params.shapeProfile)
        ? t("fieldGroups.shapeDescriptionTypewriter", getKeyUnitCopyValues())
        : t("fieldGroups.shapeDescriptionShell", getKeyUnitCopyValues())
    ),
    fields: [
      {
        key: "shapeProfile",
        label: () => t("fields.shapeProfile.label"),
        hint: () => t("fields.shapeProfile.hint"),
        type: "select",
        options: () => getShapeProfileOptions(),
      },
      {
        key: "keyWidth",
        label: () => t("fields.keyWidth.label"),
        hint: () => t("fields.keyWidth.hint", getKeyUnitCopyValues()),
        type: "linked-size",
        unit: "mm",
        step: 0.1,
        min: 10,
        primaryMiniLabel: () => t("fields.keyWidth.miniLabel"),
        secondaryLabel: () => t("fields.keyWidth.secondaryLabel"),
        secondaryField: "keySizeUnits",
        secondaryUnit: "u",
        secondaryStep: 0.05,
        secondaryMin: 0.5,
      },
      {
        key: "keyDepth",
        label: () => t("fields.keyDepth.label"),
        hint: () => t("fields.keyDepth.hint", getKeyUnitCopyValues()),
        type: "linked-size",
        unit: "mm",
        step: 0.1,
        min: 10,
        primaryMiniLabel: () => t("fields.keyDepth.miniLabel"),
        secondaryLabel: () => t("fields.keyDepth.secondaryLabel"),
        secondaryField: "keyDepthUnits",
        secondaryUnit: "u",
        secondaryStep: 0.05,
        secondaryMin: 0.5,
      },
      {
        key: "jisEnterNotchWidth",
        label: () => t("fields.jisEnterNotchWidth.label"),
        hint: (params) => getJisEnterNotchWidthHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
      },
      {
        key: "jisEnterNotchDepth",
        label: () => t("fields.jisEnterNotchDepth.label"),
        hint: (params) => getJisEnterNotchDepthHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
      },
      {
        key: "wallThickness",
        label: () => t("fields.wallThickness.label"),
        hint: () => t("fields.wallThickness.hint"),
        unit: "mm",
        step: 0.05,
        min: 0.4,
      },
      {
        key: "typewriterCornerRadius",
        label: () => t("fields.typewriterCornerRadius.label"),
        hint: (params) => getTypewriterCornerRadiusHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
      },
      {
        key: "topScale",
        label: () => t("fields.topScale.label"),
        hint: () => t("fields.topScale.hint"),
        unit: "",
        step: 0.01,
        min: 0.5,
        max: 1,
      },
      {
        key: "bodyColor",
        label: () => t("fields.bodyColor.label"),
        hint: () => t("fields.bodyColor.hint"),
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.bodyColor,
      },
    ],
  },
  {
    id: "top",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.top.title"),
    description: () => t("fieldGroups.topDescription"),
    fields: [
      {
        key: "topCenterHeight",
        label: (params) => (isTypewriterShapeProfile(params.shapeProfile) ? t("fields.topCenterHeight.typewriterLabel") : t("fields.topCenterHeight.label")),
        hint: (params) => getTopCenterHeightHint(params),
        unit: "mm",
        step: 0.1,
        min: 1,
      },
      {
        key: "topOffsetX",
        label: () => t("fields.topOffset.label"),
        hint: () => t("fields.topOffset.hint"),
        type: "number-pair",
        unit: "mm",
        step: 0.1,
        primaryMiniLabel: () => t("fields.topOffsetX.label"),
        secondaryLabel: () => t("fields.topOffsetY.label"),
        secondaryField: "topOffsetY",
        secondaryUnit: "mm",
        secondaryStep: 0.1,
      },
      {
        key: "topOffsetY",
        label: () => t("fields.topOffsetY.label"),
        hint: () => t("fields.topOffsetY.hint"),
        unit: "mm",
        step: 0.1,
      },
      {
        key: "topSurfaceShape",
        label: () => t("fields.topSurfaceShape.label"),
        hint: () => getTopSurfaceShapeHint(),
        type: "select",
        options: TOP_SURFACE_SHAPE_OPTIONS,
        dependentFieldKeys: ["dishDepth"],
      },
      {
        key: "dishDepth",
        label: () => t("fields.dishDepth.label"),
        hint: (params) => getDishDepthHint(params),
        unit: "mm",
        step: 0.05,
        visibleWhen: (params) => params.topSurfaceShape !== "flat",
      },
      {
        key: "topHatEnabled",
        label: () => t("fields.topHatEnabled.label"),
        hint: () => t("fields.topHatEnabled.hint"),
        type: "checkbox",
        dependentFieldKeys: [
          "topHatTopWidth",
          "topHatTopDepth",
          "topHatInset",
          "topHatTopRadius",
          "topHatHeight",
          "topHatShoulderAngle",
          "topHatShoulderRadius",
        ],
      },
      {
        key: "topHatTopWidth",
        label: () => t("fields.topHatTopWidth.label"),
        hint: (params) => getTopHatTopWidthHint(params),
        type: "linked-size",
        unit: "mm",
        step: 0.1,
        min: TOP_HAT_MIN_SIZE,
        primaryMiniLabel: () => t("fields.topHatTopWidth.miniLabel"),
        secondaryLabel: () => t("fields.topHatTopWidth.secondaryLabel"),
        secondaryField: "topHatTopWidthUnits",
        secondaryUnit: "u",
        secondaryStep: 0.05,
        secondaryMin: () => TOP_HAT_MIN_SIZE / getKeyUnitMm(),
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "topHatTopDepth",
        label: () => t("fields.topHatTopDepth.label"),
        hint: (params) => getTopHatTopDepthHint(params),
        type: "linked-size",
        unit: "mm",
        step: 0.1,
        min: TOP_HAT_MIN_SIZE,
        primaryMiniLabel: () => t("fields.topHatTopDepth.miniLabel"),
        secondaryLabel: () => t("fields.topHatTopDepth.secondaryLabel"),
        secondaryField: "topHatTopDepthUnits",
        secondaryUnit: "u",
        secondaryStep: 0.05,
        secondaryMin: () => TOP_HAT_MIN_SIZE / getKeyUnitMm(),
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "topHatInset",
        label: () => t("fields.topHatInset.label"),
        hint: (params) => getTopHatInsetHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
        max: (params) => getJisEnterTopHatInsetMax(params),
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "topHatTopRadius",
        label: () => t("fields.topHatTopRadius.label"),
        hint: (params) => getTopHatTopRadiusHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "topHatHeight",
        label: () => t("fields.topHatHeight.label"),
        hint: (params) => getTopHatHeightHint(params),
        unit: "mm",
        step: 0.05,
        min: (params) => getTopHatHeightMin(params),
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "topHatShoulderAngle",
        label: () => t("fields.topHatShoulderAngle.label"),
        hint: () => t("fields.topHatShoulderAngle.hint"),
        unit: "deg",
        step: 0.5,
        min: TOP_HAT_MIN_SHOULDER_ANGLE,
        max: TOP_HAT_MAX_SHOULDER_ANGLE,
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "topHatShoulderRadius",
        label: () => t("fields.topHatShoulderRadius.label"),
        hint: (params) => getTopHatShoulderRadiusHint(params),
        unit: "mm",
        step: 0.05,
        min: (params) => getTopHatShoulderRadiusMin(params),
        max: (params) => getTopHatShoulderRadiusMax(params),
        visibleWhen: (params) => params.topHatEnabled,
      },
      {
        key: "rimEnabled",
        label: () => t("fields.rimEnabled.label"),
        hint: () => t("fields.rimEnabled.hint"),
        type: "checkbox",
      },
      {
        key: "rimWidth",
        label: () => t("fields.rimWidth.label"),
        hint: (params) => getTypewriterRimWidthHint(params),
        unit: "mm",
        step: 0.1,
        min: 0,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "rimHeightUp",
        label: () => t("fields.rimHeightUp.label"),
        hint: () => getTypewriterRimHeightUpHint(),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "rimHeightDown",
        label: () => t("fields.rimHeightDown.label"),
        hint: () => getTypewriterRimHeightDownHint(),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "rimColor",
        label: () => t("fields.rimColor.label"),
        hint: () => t("fields.rimColor.hint"),
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.rimColor,
        visibleWhen: (params) => params.rimEnabled,
      },
      {
        key: "topSlopeInputMode",
        label: () => t("fields.topSlopeInputMode.label"),
        hint: () => t("fields.topSlopeInputMode.hint"),
        type: "select",
        options: TOP_SLOPE_INPUT_MODE_OPTIONS,
        dependentFieldKeys: [
          "topPitchDeg",
          "topRollDeg",
          "topFrontHeight",
          "topBackHeight",
          "topLeftHeight",
          "topRightHeight",
        ],
      },
      {
        key: "topPitchDeg",
        label: () => t("fields.topPitchDeg.label"),
        hint: (params) => getTopPitchHint(params),
        unit: "deg",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "angle",
      },
      {
        key: "topRollDeg",
        label: () => t("fields.topRollDeg.label"),
        hint: (params) => getTopRollHint(params),
        unit: "deg",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "angle",
      },
      {
        key: "topFrontHeight",
        label: () => t("fields.topFrontHeight.label"),
        hint: (params) => getTopFrontHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
      {
        key: "topBackHeight",
        label: () => t("fields.topBackHeight.label"),
        hint: (params) => getTopBackHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
      {
        key: "topLeftHeight",
        label: () => t("fields.topLeftHeight.label"),
        hint: (params) => getTopLeftHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
      {
        key: "topRightHeight",
        label: () => t("fields.topRightHeight.label"),
        hint: (params) => getTopRightHeightHint(params),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.topSlopeInputMode === "edge-height",
      },
    ],
  },
  {
    id: "legend",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.legend.title"),
    description: () => t("shapeProfiles.custom-shell.fieldGroups.legend.description"),
    fields: [
      ...createLegendControlFields({ paramPrefix: "legend", collapseControlled: true }),
      ...SIDE_LEGEND_CONFIGS.flatMap((config) => createLegendControlFields({
        paramPrefix: config.paramPrefix,
        side: config.side,
        collapseControlled: true,
      })),
    ],
  },
  {
    id: "homing",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.homing.title"),
    description: () => t("shapeProfiles.custom-shell.fieldGroups.homing.description"),
    fields: [
      { key: "homingBarEnabled", label: () => t("fields.homingBarEnabled.label"), hint: () => t("fields.homingBarEnabled.hint"), type: "checkbox" },
      {
        key: "homingBarColor",
        label: () => t("fields.homingBarColor.label"),
        hint: () => t("fields.homingBarColor.hint"),
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.homingBarColor,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarLength",
        label: () => t("fields.homingBarLength.label"),
        hint: () => t("fields.homingBarLength.hint"),
        unit: "mm",
        step: 0.1,
        min: 0.5,
        dependentFieldKeys: ["homingBarWidth", "homingBarChamfer"],
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarWidth",
        label: () => t("fields.homingBarWidth.label"),
        hint: () => t("fields.homingBarWidth.hint"),
        unit: "mm",
        step: 0.05,
        min: 0.1,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarHeight",
        label: () => t("fields.homingBarHeight.label"),
        hint: () => t("fields.homingBarHeight.hint"),
        unit: "mm",
        step: 0.05,
        min: 0.05,
        dependentFieldKeys: ["homingBarOffsetY"],
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarChamfer",
        label: () => t("fields.homingBarChamfer.label"),
        hint: () => t("fields.homingBarChamfer.hint"),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarOffsetY",
        label: () => t("fields.homingBarOffsetY.label"),
        hint: () => t("fields.homingBarOffsetY.hint"),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.homingBarEnabled,
      },
    ],
  },
  {
    id: "stem",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.stem.title"),
    description: (params) => getStemGroupDescription(params),
    fields: [
      {
        key: "stemType",
        label: () => t("fields.stemType.label"),
        hint: () => t("fields.stemType.hint"),
        type: "select",
        options: STEM_TYPE_OPTIONS,
      },
      {
        key: "typewriterMountHeight",
        label: () => t("fields.typewriterMountHeight.label"),
        hint: (params) => getTypewriterMountHeightHint(params),
        unit: "mm",
        step: 0.1,
        min: 1,
        visibleWhen: (params) => params.stemEnabled,
      },
      {
        key: "stemOuterDelta",
        label: () => t("fields.stemOuterDelta.label"),
        hint: (params) => getStemOuterHint(params),
        unit: "mm",
        step: 0.02,
        visibleWhen: (params) => params.stemEnabled && isCrossCompatibleStemType(resolveStemType(params)),
      },
      {
        key: "stemCrossMargin",
        label: () => t("fields.stemCrossMargin.label"),
        hint: (params) => getStemFitHint(params),
        unit: "mm",
        step: 0.02,
        visibleWhen: (params) => params.stemEnabled,
      },
      {
        key: "stemInsetDelta",
        label: () => t("fields.stemInsetDelta.label"),
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
function createFieldGroupCollapseState() {
  const groupIds = keycapEditorProfiles.profiles.flatMap((profile) => (profile.fieldGroups ?? []).map((group) => group.id));
  return {
    ...Object.fromEntries(Array.from(new Set(groupIds)).map((groupId) => [groupId, true])),
    ...Object.fromEntries(LEGEND_CARD_DEFINITIONS.map((card) => [card.id, true])),
  };
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
  const fieldConfig = {
    ...baseField,
    ...override,
  };

  if (fieldKey === "topCenterHeight") {
    fieldConfig.label = baseField.label;
    fieldConfig.hint = baseField.hint;
  }

  return fieldConfig;
}

function getActiveFieldGroups(profileKey = state.keycapParams?.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY) {
  const unitCopyValues = getKeyUnitCopyValues();

  return getShapeProfileFieldGroups(profileKey)
    .map((group) => ({
      ...group,
      title: t(`shapeProfiles.${profileKey}.fieldGroups.${group.id}.title`, {}, resolveDynamicCopy(group.title)),
      fields: getGroupFieldConfigs(group, profileKey),
      description: group.descriptionKey != null
        ? (FIELD_GROUP_DESCRIPTION_RESOLVERS[group.descriptionKey] ?? group.description ?? "")
        : t(`shapeProfiles.${profileKey}.fieldGroups.${group.id}.description`, unitCopyValues, resolveDynamicCopy(group.description)),
    }));
}

function getGroupFieldConfigs(group, profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const fields = (group.fieldKeys ?? [])
    .map((fieldKey) => getFieldConfig(fieldKey, profileKey))
    .filter(Boolean);

  if (group.id !== "shape") {
    return fields;
  }

  const keyWidthIndex = fields.findIndex((field) => field.key === "keyWidth");
  const insertIndex = keyWidthIndex >= 0 ? keyWidthIndex : fields.length;
  fields.splice(insertIndex, 0, getKeyUnitBasisFieldConfig());
  return fields;
}

function getKeyUnitBasisFieldConfig() {
  return {
    key: KEY_UNIT_FIELD_KEY,
    type: "key-unit-basis",
    label: () => t("unitBasis.fieldLabel"),
    hint: () => t("unitBasis.fieldHint"),
    unit: "mm",
    min: KEY_UNIT_MIN_MM,
    step: 0.05,
  };
}

function getShapeProfileVisibleFieldKeys(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return new Set(
    getShapeProfileFieldGroups(profileKey)
      .flatMap((group) => group.fieldKeys ?? [])
      .filter(Boolean),
  );
}

const initialLocale = getInitialLocale();

const state = {
  locale: initialLocale,
  isLanguageMenuOpen: false,
  exportsStatus: "idle",
  exportsSummary: translate(initialLocale, "status.notGenerated"),
  exportHistory: [],
  isExportOptionsOpen: false,
  editorStatus: "idle",
  editorSummary: translate(initialLocale, "status.notGenerated"),
  editorLogs: [],
  editorError: "",
  previewLayers: [],
  sidebarTab: "params",
  isImportDragActive: false,
  legendFontPickerFieldKey: "",
  legendFontPickerQuery: "",
  copiedFontAttributionKey: "",
  collapsedFieldGroups: createFieldGroupCollapseState(),
  keyUnitMm: readKeyUnitMmPreference(),
  keycapParams: createInitialKeycapParams(),
};

syncDerivedKeycapParams(state.keycapParams);

if (!app) {
  throw new Error(t("errors.appRootMissing"));
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
  return (Number(value) / getKeyUnitMm()).toFixed(2);
}

function resolvePublicAssetUrl(relativePath) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(relativePath, baseUrl).toString();
}

function getParameterGroupIconPath(groupId) {
  return PARAMETER_GROUP_ICON_PATHS[groupId] ?? PARAMETER_GROUP_ICON_PATHS.shape;
}

function getParameterGroupCaption(groupId) {
  const captionKey = PARAMETER_GROUP_CAPTION_KEYS[groupId];
  return captionKey ? t(captionKey, {}, "") : "";
}

function renderParameterGroupIcon(groupId) {
  const iconUrl = resolvePublicAssetUrl(getParameterGroupIconPath(groupId));
  const iconSymbolClass = groupId === "stem"
    ? "field-group-card__icon-symbol field-group-card__icon-symbol--stem"
    : "field-group-card__icon-symbol";

  return `
    <span class="field-group-card__icon" aria-hidden="true">
      <span
        class="${iconSymbolClass}"
        style="--field-group-icon: url('${escapeHtml(iconUrl)}');"
      ></span>
    </span>
  `;
}

function renderFieldLeadingIcon(iconPath) {
  const iconUrl = resolvePublicAssetUrl(iconPath);

  return `
    <span class="field-leading-icon" aria-hidden="true">
      <span
        class="field-leading-icon__symbol"
        style="--field-leading-icon: url('${escapeHtml(iconUrl)}');"
      ></span>
    </span>
  `;
}

function renderKeyUnitBasisIcon() {
  return renderFieldLeadingIcon(KEY_UNIT_BASIS_ICON_PATH);
}

function renderKeyDepthBasisIcon() {
  return renderFieldLeadingIcon(KEY_DEPTH_BASIS_ICON_PATH);
}

function renderKeyWallThicknessIcon() {
  return renderFieldLeadingIcon(KEY_WALL_THICKNESS_ICON_PATH);
}

function renderKeyTopTaperIcon() {
  return renderFieldLeadingIcon(KEY_TOP_TAPER_ICON_PATH);
}

function getColorFieldValue(fieldKey) {
  return normalizeHexColor(state.keycapParams[fieldKey]) ?? DEFAULT_KEYCAP_COLORS[fieldKey];
}

function getColorFieldNumber(fieldKey) {
  return hexColorToNumber(getColorFieldValue(fieldKey));
}

function getPartLabel(partName) {
  const sideLegendConfig = SIDE_LEGEND_CONFIGS.find((config) => partName === `legend-${config.side}`);
  if (sideLegendConfig) {
    return t("partLabels.sideLegend", { side: getSideLegendLabel(sideLegendConfig.side) });
  }

  switch (partName) {
    case "rim":
      return t("partLabels.rim");
    case "legend":
      return t("partLabels.legend");
    case "homing":
      return t("partLabels.homing");
    default:
      return t("partLabels.body");
  }
}

function describePartLabels(parts) {
  return parts.map((part) => getPartLabel(part)).join(t("format.listSeparator"));
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
    closeLabel: t("actions.close"),
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
      reject(new Error(t("errors.colorisLoadFailed")));
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

function isSideLegendRenderable(config) {
  const enabledKey = legendParamKey(config.paramPrefix, LEGEND_FIELD_SUFFIXES.enabled);
  const textKey = legendParamKey(config.paramPrefix, LEGEND_FIELD_SUFFIXES.text);
  return state.keycapParams[enabledKey] && isLegendTextSet(state.keycapParams[textKey]);
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
          <strong data-i18n="dropOverlay.title"></strong>
          <span data-i18n="dropOverlay.body"></span>
        </div>
      </div>
      <div class="language-control" data-language-control></div>
      <section class="editor-screen">
        <aside class="left-column">
          <article class="inspector-card">
            <nav
              class="segment-control"
              data-i18n-aria-label="navigation.label"
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
                      ${getWorkspaceSectionLabel(section)}
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
  app.querySelector("[data-language-control]")?.addEventListener("click", handleLanguageControlClick);
  app.querySelector(".inspector-card")?.addEventListener("click", handleInspectorCardClick);
  app.querySelector(".inspector-card")?.addEventListener("input", handleInspectorCardInput);
  app.querySelector(".inspector-card")?.addEventListener("change", handleInspectorCardChange);
  app.querySelector(".inspector-card")?.addEventListener("compositionend", handleInspectorCardCompositionEnd);
  app.querySelector(".inspector-card")?.addEventListener("keydown", handleInspectorCardKeydown);
  attachEditorDataDropListeners();
  renderPersistentShellCopy();
  renderLanguageControl();
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

function renderPersistentShellCopy() {
  app.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  app.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });
}

function renderLanguageControl() {
  const container = app.querySelector("[data-language-control]");
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="language-combobox ${state.isLanguageMenuOpen ? "is-open" : ""}">
      <button
        class="language-combobox__button"
        type="button"
        data-language-toggle
        aria-haspopup="listbox"
        aria-expanded="${state.isLanguageMenuOpen ? "true" : "false"}"
        aria-controls="language-options"
        aria-label="${escapeHtml(t("language.ariaLabel"))}"
      >
        <span class="language-combobox__icon" aria-hidden="true">${GLOBE_ICON_MARKUP}</span>
        <span class="language-combobox__label">${escapeHtml(t("language.label"))}</span>
      </button>
      ${state.isLanguageMenuOpen ? `
        <div class="language-combobox__menu" id="language-options" role="listbox" aria-label="${escapeHtml(t("language.listLabel"))}">
          ${LOCALE_OPTIONS.map((option) => {
            const isSelected = option.value === state.locale;
            return `
              <button
                class="language-combobox__option ${isSelected ? "is-selected" : ""}"
                type="button"
                role="option"
                aria-selected="${isSelected ? "true" : "false"}"
                data-language-option="${option.value}"
              >
                ${escapeHtml(t(option.labelKey))}
              </button>
            `;
          }).join("")}
        </div>
      ` : ""}
    </div>
  `;
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
    const section = workspaceSections.find((entry) => entry.id === button.dataset.sidebarTab);
    button.textContent = section ? getWorkspaceSectionLabel(section) : button.dataset.sidebarTab;
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
    renderPersistentShellCopy();
    renderLanguageControl();
    renderSegmentControl();
    renderInspectorPanel();
    configureColoris();
    syncImportDropOverlay();
    focusLegendFontPickerQuery();
  };

  if (animateInspector && isUiMotionEnabled()) {
    const transition = document.startViewTransition(applyUpdate);
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
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
        <h1 class="panel-title">${t("panels.settings.title")}</h1>
        <p class="panel-text">${t("panels.settings.body")}</p>
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
        <h1 class="panel-title">${t("panels.export.title")}</h1>
        <p class="panel-text">${t("panels.export.body")}</p>
      </div>

      <div class="export-button-list">
        <section class="export-action-card" aria-labelledby="export-json-title">
          <div class="export-action-card__header">
            <span class="export-action-card__icon" aria-hidden="true">${EXPORT_ICON_MARKUP.file}</span>
            <span class="export-action-card__title-stack">
              <span class="chip-label">${t("exportPanel.jsonChip")}</span>
              <strong id="export-json-title">${t("exportPanel.jsonTitle")}</strong>
            </span>
          </div>
          <p class="export-action-card__text">${t("exportPanel.jsonBody")}</p>
          <button class="export-save-button" type="button" data-export="editor-data" ${state.exportsStatus === "running" ? "disabled" : ""}>
            ${EXPORT_ICON_MARKUP.download}
            <span>${state.exportsStatus === "running" ? t("actions.saving") : t("exportPanel.saveJson")}</span>
          </button>
        </section>
        <section class="export-action-card" aria-labelledby="export-3mf-title">
          <div class="export-action-card__header">
            <span class="export-action-card__icon" aria-hidden="true">${EXPORT_ICON_MARKUP.package}</span>
            <span class="export-action-card__title-stack">
              <span class="chip-label">${t("exportPanel.threeMfChip")}</span>
              <strong id="export-3mf-title">${t("exportPanel.threeMfTitle")}</strong>
            </span>
          </div>
          <p class="export-action-card__text">${t("exportPanel.threeMfBody")}</p>
          <button class="export-save-button" type="button" data-export="3mf" ${state.exportsStatus === "running" ? "disabled" : ""}>
            ${EXPORT_ICON_MARKUP.download}
            <span>${state.exportsStatus === "running" ? t("actions.saving") : t("exportPanel.saveThreeMf")}</span>
          </button>
        </section>
        ${renderExportOptionsCard()}
      </div>
      <p class="visually-hidden" aria-live="polite" data-export-status>${state.exportsSummary}</p>
    </div>
  `;
}

function renderExportOptionsCard() {
  const isOpen = state.isExportOptionsOpen;
  const optionsBodyId = "export-options-body";
  const toggleIconUrl = isOpen ? CHEVRON_ICON_URLS.expanded : CHEVRON_ICON_URLS.collapsed;
  const toggleLabel = isOpen ? t("exportPanel.optionsCollapse") : t("exportPanel.optionsExpand");

  return `
    <section class="export-options-card" aria-labelledby="export-options-title">
      <div class="field-group-header">
        <div class="field-group-header__row">
          <div class="export-options-card__title-stack">
            <h3 id="export-options-title">${t("exportPanel.optionsTitle")}</h3>
            <p>${t("exportPanel.optionsBody")}</p>
          </div>
          <button
            class="field-group-toggle"
            type="button"
            data-export-options-toggle
            aria-expanded="${isOpen ? "true" : "false"}"
            aria-controls="${optionsBodyId}"
            aria-label="${toggleLabel}"
          >
            <img class="field-group-toggle__icon" src="${toggleIconUrl}" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="export-options-card__body" id="${optionsBodyId}" ${isOpen ? "" : "hidden"}>
        <section class="export-option-action" aria-labelledby="export-stl-title">
          <div class="export-action-card__header">
            <span class="export-action-card__icon" aria-hidden="true">${EXPORT_ICON_MARKUP.package}</span>
            <span class="export-action-card__title-stack">
              <span class="chip-label">${t("exportPanel.stlChip")}</span>
              <strong id="export-stl-title">${t("exportPanel.stlTitle")}</strong>
            </span>
          </div>
          <p class="export-action-card__text">${t("exportPanel.stlBody")}</p>
          <button class="export-save-button" type="button" data-export="stl" ${state.exportsStatus === "running" ? "disabled" : ""}>
            ${EXPORT_ICON_MARKUP.download}
            <span>${state.exportsStatus === "running" ? t("actions.saving") : t("exportPanel.saveStl")}</span>
          </button>
        </section>
      </div>
    </section>
  `;
}

function renderFieldGroupToggleButton({
  groupId,
  isCollapsed,
  groupBodyId,
  toggleLabel,
  toggleIconUrl,
}) {
  return `
    <button
      class="field-group-toggle"
      type="button"
      data-field-group-toggle="${escapeHtml(groupId)}"
      aria-expanded="${isCollapsed ? "false" : "true"}"
      aria-controls="${escapeHtml(groupBodyId)}"
      aria-label="${escapeHtml(toggleLabel)}"
    >
      <img class="field-group-toggle__icon" src="${toggleIconUrl}" alt="" aria-hidden="true" />
    </button>
  `;
}

function renderParameterCardHeader({
  groupId,
  title,
  titleId,
  caption = "",
  toggleButton = "",
}) {
  const captionMarkup = caption
    ? `<p class="field-group-card__caption">${escapeHtml(caption)}</p>`
    : "";
  const titleStackClass = captionMarkup
    ? "field-group-card__title-stack"
    : "field-group-card__title-stack field-group-card__title-stack--solo";

  return `
    <div class="field-group-header">
      <div class="field-group-card__header">
        ${renderParameterGroupIcon(groupId)}
        <span class="${titleStackClass}">
          <h3 id="${escapeHtml(titleId)}">${escapeHtml(title)}</h3>
          ${captionMarkup}
        </span>
        ${toggleButton}
      </div>
    </div>
  `;
}

function renderNameFieldCard() {
  const groupViewTransitionName = createViewTransitionName("field-group", SETTINGS_NAME_FIELD.key);
  const fieldViewTransitionName = createViewTransitionName("field", SETTINGS_NAME_FIELD.key);
  const value = state.keycapParams[SETTINGS_NAME_FIELD.key];
  const fieldLabel = resolveDynamicCopy(SETTINGS_NAME_FIELD.label);
  const fieldPlaceholder = resolveDynamicCopy(SETTINGS_NAME_FIELD.placeholder);
  const titleId = "settings-name-card-title";

  return `
    <section class="field-group-card" aria-labelledby="${titleId}" style="view-transition-name: ${groupViewTransitionName};">
      ${renderParameterCardHeader({
        groupId: "name",
        title: t("nameGroup.title"),
        titleId,
        caption: getParameterGroupCaption("name"),
      })}
      <div class="field-group-body">
        <span class="field-control name-field-control" style="view-transition-name: ${fieldViewTransitionName};">
          <input
            id="settings-name-input"
            type="text"
            data-field="${SETTINGS_NAME_FIELD.key}"
            value="${escapeHtml(value)}"
            aria-label="${escapeHtml(fieldLabel)}"
            ${SETTINGS_NAME_FIELD.maxLength != null ? `maxlength="${SETTINGS_NAME_FIELD.maxLength}"` : ""}
            ${fieldPlaceholder ? `placeholder="${escapeHtml(fieldPlaceholder)}"` : ""}
            spellcheck="false"
            autocomplete="off"
          />
        </span>
      </div>
    </section>
  `;
}

function renderKeyUnitBasisReadout() {
  return t("unitBasis.readout", {
    widthUnits: formatUnitInputValue(state.keycapParams.keyWidth),
    depthUnits: formatUnitInputValue(state.keycapParams.keyDepth),
  });
}

function renderFieldGridContents(fields, fieldByKey) {
  const dependentFieldKeys = getVisibleDependentFieldKeys(fields, fieldByKey);
  const pairedFieldKeys = getVisiblePairedFieldKeys(fields, fieldByKey);
  const visibleFields = fields.filter((field) => isFieldVisible(field) && !dependentFieldKeys.has(field.key) && !pairedFieldKeys.has(field.key));

  return visibleFields.map((field) => renderFieldWithDependents(field, fieldByKey)).join("");
}

function renderFieldGroup(group, groupIndex) {
  if (group.id === "legend") {
    return renderLegendFieldGroup(group, groupIndex);
  }

  const groupId = group.id ?? `group-${groupIndex}`;
  const isCollapsed = state.collapsedFieldGroups[groupId] === true;
  const groupViewTransitionName = createViewTransitionName("field-group", groupId);
  const groupBodyId = `field-group-body-${groupId}`;
  const groupFieldByKey = new Map(group.fields.map((field) => [field.key, field]));
  const toggleLabel = isCollapsed
    ? t("fieldGroup.expand", { title: group.title })
    : t("fieldGroup.collapse", { title: group.title });
  const toggleIconUrl = isCollapsed ? CHEVRON_ICON_URLS.collapsed : CHEVRON_ICON_URLS.expanded;
  const titleId = `field-group-title-${toKebabCase(groupId)}`;
  const toggleButton = renderFieldGroupToggleButton({
    groupId,
    isCollapsed,
    groupBodyId,
    toggleLabel,
    toggleIconUrl,
  });

  return `
    <section class="field-group-card" aria-labelledby="${titleId}" style="view-transition-name: ${groupViewTransitionName};">
      ${renderParameterCardHeader({
        groupId,
        title: group.title,
        titleId,
        caption: getParameterGroupCaption(groupId),
        toggleButton,
      })}
      <div class="field-group-body" id="${groupBodyId}" ${isCollapsed ? "hidden" : ""}>
        <div class="field-grid">
          ${renderFieldGridContents(group.fields, groupFieldByKey)}
        </div>
      </div>
    </section>
  `;
}

function renderLegendFieldGroup(group, groupIndex) {
  const groupId = group.id ?? `group-${groupIndex}`;
  const isCollapsed = state.collapsedFieldGroups[groupId] === true;
  const groupViewTransitionName = createViewTransitionName("field-group", groupId);
  const groupBodyId = `field-group-body-${groupId}`;
  const groupFieldByKey = new Map(group.fields.map((field) => [field.key, field]));
  const toggleLabel = isCollapsed
    ? t("fieldGroup.expand", { title: group.title })
    : t("fieldGroup.collapse", { title: group.title });
  const toggleIconUrl = isCollapsed ? CHEVRON_ICON_URLS.collapsed : CHEVRON_ICON_URLS.expanded;
  const titleId = `field-group-title-${toKebabCase(groupId)}`;
  const toggleButton = renderFieldGroupToggleButton({
    groupId,
    isCollapsed,
    groupBodyId,
    toggleLabel,
    toggleIconUrl,
  });

  return `
    <section class="field-group-card" aria-labelledby="${titleId}" style="view-transition-name: ${groupViewTransitionName};">
      ${renderParameterCardHeader({
        groupId,
        title: group.title,
        titleId,
        caption: getParameterGroupCaption(groupId),
        toggleButton,
      })}
      <div class="field-group-body" id="${groupBodyId}" ${isCollapsed ? "hidden" : ""}>
        <div class="legend-subcard-list">
          ${LEGEND_CARD_DEFINITIONS.map((card) => renderLegendSubcard(card, groupFieldByKey)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderLegendSubcard(card, groupFieldByKey) {
  const cardFields = card.fieldKeys.map((fieldKey) => groupFieldByKey.get(fieldKey)).filter(Boolean);
  if (cardFields.length === 0) {
    return "";
  }

  const cardFieldByKey = new Map(cardFields.map((field) => [field.key, field]));
  const cardTitle = resolveDynamicCopy(card.title);
  const cardBodyId = `legend-subcard-body-${card.id}`;
  const isCollapsed = state.collapsedFieldGroups[card.id] === true;
  const toggleLabel = isCollapsed
    ? t("fieldGroup.expand", { title: cardTitle })
    : t("fieldGroup.collapse", { title: cardTitle });
  const toggleIconUrl = isCollapsed ? CHEVRON_ICON_URLS.collapsed : CHEVRON_ICON_URLS.expanded;
  const cardViewTransitionName = createViewTransitionName("legend-subcard", card.id);

  return `
    <section class="legend-subcard" style="view-transition-name: ${cardViewTransitionName};">
      <div class="legend-subcard__header">
        <h4>${escapeHtml(cardTitle)}</h4>
        <button
          class="field-group-toggle"
          type="button"
          data-field-group-toggle="${card.id}"
          aria-expanded="${isCollapsed ? "false" : "true"}"
          aria-controls="${cardBodyId}"
          aria-label="${escapeHtml(toggleLabel)}"
        >
          <img class="field-group-toggle__icon" src="${toggleIconUrl}" alt="" aria-hidden="true" />
        </button>
      </div>
      <div class="legend-subcard__body" id="${cardBodyId}" ${isCollapsed ? "hidden" : ""}>
        <p class="field-note">${escapeHtml(t("fields.legendPrintNotice"))}</p>
        <div class="field-grid">
          ${renderFieldGridContents(cardFields, cardFieldByKey)}
        </div>
      </div>
    </section>
  `;
}

function getVisibleDependentFieldKeys(fields, fieldByKey) {
  return new Set(
    fields
      .filter((field) => isFieldVisible(field) && canRenderDependentFields(field))
      .flatMap((field) => field.dependentFieldKeys ?? [])
      .filter((fieldKey) => fieldByKey.has(fieldKey)),
  );
}

function getVisiblePairedFieldKeys(fields, fieldByKey) {
  return new Set(
    fields
      .filter((field) => isFieldVisible(field) && field.type === "number-pair")
      .map((field) => field.secondaryField)
      .filter((fieldKey) => fieldKey && fieldByKey.has(fieldKey) && isFieldVisible(fieldByKey.get(fieldKey))),
  );
}

function canRenderDependentFields(field) {
  return field.type == null || field.type === "checkbox" || field.type === "select" || field.type === "font-search";
}

function renderFieldWithDependents(field, fieldByKey) {
  const dependentFieldKeys = field.dependentFieldKeys ?? [];
  if (dependentFieldKeys.length === 0 || !canRenderDependentFields(field)) {
    return renderField(field);
  }

  const dependentFields = dependentFieldKeys
    .map((fieldKey) => fieldByKey.get(fieldKey))
    .filter(Boolean)
    .filter((dependentField) => isFieldVisible(dependentField));

  if (field.type === "select") {
    return renderFieldWithDependentFields(field, dependentFields, fieldByKey);
  }

  return renderField(field, { dependentFields, fieldByKey });
}

function renderDependentFieldList(dependentFields, fieldByKey = null) {
  if (dependentFields.length === 0) {
    return "";
  }

  return `
    <div class="field-dependent-list">
      ${dependentFields.map((dependentField) => {
        const nestedDependentFields = (dependentField.dependentFieldKeys ?? [])
          .map((fieldKey) => fieldByKey?.get(fieldKey))
          .filter(Boolean)
          .filter((nestedField) => isFieldVisible(nestedField));

        return renderField(dependentField, {
          className: "field--dependent",
          dependentFields: nestedDependentFields,
        });
      }).join("")}
    </div>
  `;
}

function renderFieldWithDependentFields(field, dependentFields, fieldByKey = null) {
  const value = state.keycapParams[field.key];
  const fieldViewTransitionName = createViewTransitionName("field", field.key);
  const fieldLabel = resolveDynamicCopy(field.label);
  const fieldHint = resolveDynamicCopy(field.hint);
  const fieldOptions = resolveFieldOptions(field);
  const isDisabled = isFieldDisabled(field);
  const inputId = `field-control-${field.key}`;

  return `
    <div class="field field--with-dependents" style="view-transition-name: ${fieldViewTransitionName};">
      <label class="field-copy" for="${inputId}">
        <span class="field-label">${fieldLabel}</span>
        <span class="field-hint">${fieldHint}</span>
      </label>
      <span class="field-control field-control--select">
        <select id="${inputId}" data-field="${field.key}" ${isDisabled ? "disabled" : ""}>
          ${fieldOptions
            .map(
              (option) => `
                <option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>
              `,
            )
            .join("")}
        </select>
      </span>
      ${renderDependentFieldList(dependentFields, fieldByKey)}
    </div>
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

function resolveFieldAttribute(value, params = state.keycapParams) {
  return typeof value === "function" ? value(params) : value;
}

function resolveFieldOptions(field, params = state.keycapParams) {
  const options = typeof field.options === "function" ? field.options(params) : field.options ?? [];
  return options.map((option) => localizeFieldOption(field.key, option));
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
  return font?.fontKind === "variable" ? t("font.variableMeta") : t("font.staticMeta");
}

function getLegendFontAttributionText(font) {
  const localizedLines = t(`font.attributions.${font?.key}`, {}, null);
  if (Array.isArray(localizedLines)) {
    return localizedLines.join("\n");
  }

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
        <strong>${t("font.attributionTitle")}</strong>
        <button
          class="font-attribution-card__copy"
          type="button"
          data-copy-font-attribution="${font.key}"
        >
          ${isCopied ? t("actions.copied") : t("actions.copy")}
        </button>
      </span>
      <pre class="font-attribution-card__body">${escapeHtml(attributionText)}</pre>
    </span>
  `;
}

function renderLegendFontPickerOptions(fieldKey = state.legendFontPickerFieldKey || "legendFontKey") {
  const matchingFonts = getLegendFontPickerResults();
  if (matchingFonts.length === 0) {
    return `<div class="font-picker-empty">${t("font.noResults")}</div>`;
  }

  return matchingFonts
    .map((font) => {
      const isSelected = font.key === state.keycapParams[fieldKey];
      const previewStyle = buildLegendFontPreviewStyle(font);
      const metaLabel = getLegendFontMetaLabel(font);

      return `
        <button
          class="font-picker-option ${isSelected ? "is-selected" : ""}"
          type="button"
          data-font-picker-option="${font.key}"
          data-font-picker-field="${fieldKey}"
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

function renderField(field, options = {}) {
  const value = state.keycapParams[field.key];
  const fieldViewTransitionName = createViewTransitionName("field", field.key);
  const fieldLabel = resolveDynamicCopy(field.label);
  const fieldHint = resolveDynamicCopy(field.hint);
  const fieldNote = resolveDynamicCopy(field.note);
  const primaryMiniLabel = resolveDynamicCopy(field.primaryMiniLabel);
  const secondaryLabel = resolveDynamicCopy(field.secondaryLabel);
  const fieldPlaceholder = resolveDynamicCopy(field.placeholder);
  const fieldOptions = resolveFieldOptions(field);
  const isDisabled = isFieldDisabled(field);
  const fieldMin = resolveFieldAttribute(field.min);
  const fieldMax = resolveFieldAttribute(field.max);
  const fieldStep = resolveFieldAttribute(field.step);
  const secondaryMin = resolveFieldAttribute(field.secondaryMin);
  const secondaryStep = resolveFieldAttribute(field.secondaryStep);
  const fieldClassName = options.className ? ` ${options.className}` : "";
  const dependentFields = options.dependentFields ?? [];
  const dependentFieldByKey = options.fieldByKey ?? null;
  const dependentClassName = dependentFields.length > 0 ? " field--with-dependents" : "";

  if (field.type === "key-unit-basis") {
    const inputId = `field-control-${field.key}`;

    return `
      <div class="field field--key-unit-basis field--with-leading-icon${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        ${renderKeyUnitBasisIcon()}
        <label class="field-copy" for="${inputId}">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </label>
        <span class="field-control">
          <input
            id="${inputId}"
            type="number"
            data-key-unit-mm
            value="${formatKeyUnitMmInputValue()}"
            ${fieldMin != null ? `min="${fieldMin}"` : ""}
            ${fieldStep != null ? `step="${fieldStep}"` : ""}
            aria-label="${escapeHtml(fieldLabel)}"
          />
          ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
        </span>
        <span class="key-unit-basis-readout" aria-live="polite" data-key-unit-readout>${renderKeyUnitBasisReadout()}</span>
      </div>
    `;
  }

  if (field.type === "checkbox") {
    const checkboxControl = `
      <label class="field-checkbox-header">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="checkbox-pill">
          <input type="checkbox" data-field="${field.key}" ${value ? "checked" : ""} />
          <span>${value ? t("actions.on") : t("actions.off")}</span>
        </span>
      </label>
    `;

    if (dependentFields.length > 0) {
      return `
        <div class="field field--checkbox${dependentClassName}${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
          ${checkboxControl}
          ${fieldNote ? `<p class="field-note">${escapeHtml(fieldNote)}</p>` : ""}
          ${renderDependentFieldList(dependentFields, dependentFieldByKey)}
        </div>
      `;
    }

    return `
      <div class="field field--checkbox${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        ${checkboxControl}
      </div>
    `;
  }

  if (field.type === "font-search") {
    const selectedFont = resolveLegendFontConfig(value);
    const selectedFontLabel = selectedFont.label;
    const selectedPreviewStyle = buildLegendFontPreviewStyle(selectedFont);
    const selectedFontMetaLabel = getLegendFontMetaLabel(selectedFont);
    const selectedFontAttributionCard = renderLegendFontAttributionCard(selectedFont);
    const pickerId = `font-picker-${field.key}`;
    const isPickerOpen = state.legendFontPickerFieldKey === field.key;

    return `
      <div class="field field--font-search${dependentClassName} ${isPickerOpen ? "is-open" : ""}${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
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
                aria-label="${escapeHtml(t("font.searchAriaLabel"))}"
              >
                ${SEARCH_ICON_MARKUP}
              </button>
            </span>
            ${isPickerOpen ? `
              <span class="font-picker-popover" id="${pickerId}" role="dialog" aria-label="${escapeHtml(t("font.searchDialogLabel"))}">
                <label class="field-control font-picker-search-input">
                  <span class="font-picker-search-input__icon">${SEARCH_ICON_MARKUP}</span>
                  <input
                    type="text"
                    data-font-picker-query="${field.key}"
                    value="${escapeHtml(state.legendFontPickerQuery)}"
                    placeholder="${escapeHtml(t("font.searchPlaceholder"))}"
                    spellcheck="false"
                    autocomplete="off"
                  />
                </label>
                <span class="font-picker-options" data-font-picker-options>
                  ${renderLegendFontPickerOptions(field.key)}
                </span>
              </span>
            ` : ""}
          </span>
          ${selectedFontAttributionCard}
        </span>
        ${renderDependentFieldList(dependentFields, dependentFieldByKey)}
      </div>
    `;
  }

  if (field.type === "select") {
    return `
      <label class="field${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="field-control field-control--select">
          <select data-field="${field.key}" ${isDisabled ? "disabled" : ""}>
            ${fieldOptions
              .map(
                (option) => `
                  <option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>
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
      <label class="field${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
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
            ${fieldPlaceholder ? `placeholder="${escapeHtml(fieldPlaceholder)}"` : ""}
          />
        </span>
      </label>
    `;
  }

  if (field.type === "color") {
    const normalizedValue = getColorFieldValue(field.key);
    const inputId = `field-${field.key}`;

    return `
      <div class="field field--color${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
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
              ${fieldPlaceholder ? `placeholder="${escapeHtml(fieldPlaceholder)}"` : ""}
            />
          </span>
          <button class="field-color-button" type="button" data-color-picker-open="${field.key}">
            ${t("actions.choose")}
          </button>
        </span>
      </div>
    `;
  }

  if (field.type === "linked-size") {
    const leadingIcon = field.key === "keyWidth"
      ? renderKeyUnitBasisIcon()
      : field.key === "keyDepth"
        ? renderKeyDepthBasisIcon()
        : "";
    const linkedSizeIconClassName = leadingIcon ? " field--with-leading-icon" : "";

    return `
      <label class="field field--linked-size${linkedSizeIconClassName}${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        ${leadingIcon}
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="field-control-cluster field-control-cluster--linked-size">
          <span class="field-mini-control">
            <span class="field-mini-control__label">${primaryMiniLabel}</span>
            <span class="field-control">
              <input
                type="number"
                data-field="${field.key}"
                value="${formatNumericFieldValue(field.key, value)}"
                ${fieldMin != null ? `min="${fieldMin}"` : ""}
                ${fieldMax != null ? `max="${fieldMax}"` : ""}
                ${fieldStep != null ? `step="${fieldStep}"` : ""}
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
                ${secondaryMin != null ? `min="${secondaryMin}"` : ""}
                ${secondaryStep != null ? `step="${secondaryStep}"` : ""}
              />
              ${field.secondaryUnit ? `<span class="field-unit">${field.secondaryUnit}</span>` : ""}
            </span>
          </span>
        </span>
      </label>
    `;
  }

  if (field.type === "number-pair") {
    const secondaryValue = state.keycapParams[field.secondaryField];
    const secondaryFieldConfig = getFieldConfig(field.secondaryField);
    const secondaryMinValue = resolveFieldAttribute(field.secondaryMin ?? secondaryFieldConfig?.min);
    const secondaryMaxValue = resolveFieldAttribute(field.secondaryMax ?? secondaryFieldConfig?.max);
    const secondaryStepValue = resolveFieldAttribute(field.secondaryStep ?? secondaryFieldConfig?.step);

    return `
      <div class="field field--number-pair${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="field-control-cluster field-control-cluster--pair">
          <label class="field-mini-control">
            <span class="field-mini-control__label">${primaryMiniLabel}</span>
            <span class="field-control">
              <input
                type="number"
                data-field="${field.key}"
                value="${formatNumericFieldValue(field.key, value)}"
                ${fieldMin != null ? `min="${fieldMin}"` : ""}
                ${fieldMax != null ? `max="${fieldMax}"` : ""}
                ${fieldStep != null ? `step="${fieldStep}"` : ""}
              />
              ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
            </span>
          </label>
          <label class="field-mini-control">
            <span class="field-mini-control__label">${secondaryLabel}</span>
            <span class="field-control">
              <input
                type="number"
                data-field="${field.secondaryField}"
                value="${formatNumericFieldValue(field.secondaryField, secondaryValue)}"
                ${secondaryMinValue != null ? `min="${secondaryMinValue}"` : ""}
                ${secondaryMaxValue != null ? `max="${secondaryMaxValue}"` : ""}
                ${secondaryStepValue != null ? `step="${secondaryStepValue}"` : ""}
              />
              ${field.secondaryUnit ? `<span class="field-unit">${field.secondaryUnit}</span>` : ""}
            </span>
          </label>
        </span>
      </div>
    `;
  }

  if (dependentFields.length > 0) {
    const inputId = `field-control-${field.key}`;

    return `
      <div class="field${dependentClassName}${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        <label class="field-copy" for="${inputId}">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </label>
        <span class="field-control">
          <input
            id="${inputId}"
            type="number"
            data-field="${field.key}"
            value="${formatNumericFieldValue(field.key, value)}"
            ${fieldMin != null ? `min="${fieldMin}"` : ""}
            ${fieldMax != null ? `max="${fieldMax}"` : ""}
            ${fieldStep != null ? `step="${fieldStep}"` : ""}
          />
          ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
        </span>
        ${renderDependentFieldList(dependentFields, dependentFieldByKey)}
      </div>
    `;
  }

  const leadingIcon = field.key === "wallThickness"
    ? renderKeyWallThicknessIcon()
    : field.key === "topScale"
      ? renderKeyTopTaperIcon()
      : "";
  const numberIconClassName = leadingIcon ? " field--with-leading-icon field--single-number" : "";

  return `
    <label class="field${numberIconClassName}${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
      ${leadingIcon}
      <span class="field-copy">
        <span class="field-label">${fieldLabel}</span>
        <span class="field-hint">${fieldHint}</span>
      </span>
      <span class="field-control">
        <input
          type="number"
          data-field="${field.key}"
          value="${formatNumericFieldValue(field.key, value)}"
          ${fieldMin != null ? `min="${fieldMin}"` : ""}
          ${fieldMax != null ? `max="${fieldMax}"` : ""}
          ${fieldStep != null ? `step="${fieldStep}"` : ""}
        />
        ${field.unit ? `<span class="field-unit">${field.unit}</span>` : ""}
      </span>
    </label>
  `;
}

function getClosestFromEventTarget(event, selector) {
  for (const target of event.composedPath?.() ?? []) {
    if (target instanceof Element) {
      const closest = target.closest(selector);
      if (closest) {
        return closest;
      }
    }
  }

  if (event.target instanceof Element) {
    return event.target.closest(selector);
  }

  if (event.target instanceof Node) {
    return event.target.parentElement?.closest(selector) ?? null;
  }

  return null;
}

function handleLanguageControlClick(event) {
  const optionButton = getClosestFromEventTarget(event, "[data-language-option]");
  if (optionButton) {
    const nextLocale = normalizeLocale(optionButton.dataset.languageOption);
    state.isLanguageMenuOpen = false;

    if (nextLocale !== state.locale) {
      state.locale = setLocalePreference(nextLocale);
      render({ animateInspector: true });
    } else {
      render();
    }

    return;
  }

  const toggleButton = getClosestFromEventTarget(event, "[data-language-toggle]");
  if (!toggleButton) {
    return;
  }

  state.isLanguageMenuOpen = !state.isLanguageMenuOpen;
  render();
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
    applyLegendFontSelection(
      resolveLegendFontConfig(fontPickerOptionButton.dataset.fontPickerOption),
      {
        fieldKey: fontPickerOptionButton.dataset.fontPickerField,
        closePicker: true,
      },
    );
    return;
  }

  const fontPickerOpenButton = getClosestFromEventTarget(event, "[data-font-picker-open]");
  if (fontPickerOpenButton) {
    if (state.legendFontPickerFieldKey === fontPickerOpenButton.dataset.fontPickerOpen) {
      closeLegendFontPicker();
    } else {
      openLegendFontPicker(fontPickerOpenButton.dataset.fontPickerOpen);
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
    return;
  }

  const exportOptionsToggleButton = getClosestFromEventTarget(event, "[data-export-options-toggle]");
  if (exportOptionsToggleButton) {
    toggleExportOptions();
  }
}

function handleInspectorCardInput(event) {
  const fontPickerQueryInput = getClosestFromEventTarget(event, "[data-font-picker-query]");
  if (fontPickerQueryInput) {
    handleLegendFontPickerQueryInput(fontPickerQueryInput);
    return;
  }

  const keyUnitInput = getClosestFromEventTarget(event, "[data-key-unit-mm]");
  if (keyUnitInput) {
    handleKeyUnitBasisInput(keyUnitInput);
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
  const keyUnitInput = getClosestFromEventTarget(event, "[data-key-unit-mm]");
  if (keyUnitInput) {
    handleKeyUnitBasisInput(keyUnitInput, { commit: true });
    return;
  }

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

  applyLegendFontSelection(firstMatchingFont, { fieldKey: state.legendFontPickerFieldKey, closePicker: true });
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

function toggleExportOptions() {
  state.isExportOptionsOpen = !state.isExportOptionsOpen;
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
  const {
    deferPreview = false,
    closePicker = false,
    fieldKey = state.legendFontPickerFieldKey || "legendFontKey",
  } = options;

  if (closePicker) {
    state.legendFontPickerFieldKey = "";
    state.legendFontPickerQuery = "";
  }

  if (!font || font.key === state.keycapParams[fieldKey]) {
    if (closePicker) {
      render();
    }
    return false;
  }

  state.keycapParams[fieldKey] = font.key;
  syncDerivedKeycapParams(state.keycapParams);
  state.editorStatus = "dirty";
  state.editorSummary = t("status.dirty");
  render({ animateInspector: true });

  if (!deferPreview) {
    schedulePreviewRefresh();
  }

  return true;
}

function openLegendFontPicker(fieldKey = "legendFontKey") {
  state.legendFontPickerFieldKey = fieldKey;
  state.legendFontPickerQuery = "";
  pendingLegendFontPickerFocus = true;
  render();
  warmLegendFontPreviewFonts();
}

function closeLegendFontPicker() {
  if (!state.legendFontPickerFieldKey) {
    return;
  }

  state.legendFontPickerFieldKey = "";
  state.legendFontPickerQuery = "";
  render();
}

function handleLegendFontPickerQueryInput(input) {
  state.legendFontPickerQuery = input.value;
  const fieldKey = input.dataset.fontPickerQuery || state.legendFontPickerFieldKey || "legendFontKey";
  const options = input.closest("[data-font-picker]")?.querySelector("[data-font-picker-options]");
  if (options) {
    options.innerHTML = renderLegendFontPickerOptions(fieldKey);
  }
}

function handleWindowPointerDown(event) {
  let shouldRender = false;

  if (
    state.isLanguageMenuOpen
    && event.target instanceof Element
    && !event.target.closest("[data-language-control]")
  ) {
    state.isLanguageMenuOpen = false;
    shouldRender = true;
  }

  if (
    state.legendFontPickerFieldKey
    && event.target instanceof Element
    && !event.target.closest("[data-font-picker]")
  ) {
    state.legendFontPickerFieldKey = "";
    state.legendFontPickerQuery = "";
    shouldRender = true;
  }

  if (shouldRender) {
    render();
  }
}

function handleWindowKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  let shouldRender = false;

  if (state.isLanguageMenuOpen) {
    state.isLanguageMenuOpen = false;
    shouldRender = true;
  }

  if (state.legendFontPickerFieldKey) {
    state.legendFontPickerFieldKey = "";
    state.legendFontPickerQuery = "";
    shouldRender = true;
  }

  if (shouldRender) {
    render();
  }
}

function buildEditorDataFilename(params = state.keycapParams) {
  return `${sanitizeExportBaseName(params.name)}.json`;
}

function build3mfFilename(params = state.keycapParams) {
  return `${sanitizeExportBaseName(params.name)}.3mf`;
}

function buildStlFilename(params = state.keycapParams) {
  return `${sanitizeExportBaseName(params.name)}.stl`;
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
  const defaultParams = createInitialKeycapParams(profileKey);
  const previousProfileKey = state.keycapParams.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const previousGeometryType = resolveShapeGeometryType(previousProfileKey);
  const nextGeometryType = resolveShapeGeometryType(profileKey);
  const previousVisibleFieldKeys = getShapeProfileVisibleFieldKeys(previousProfileKey);
  const nextVisibleFieldKeys = getShapeProfileVisibleFieldKeys(profileKey);
  const geometryTypeChanged = previousGeometryType !== nextGeometryType;
  const footprintTypeChanged = isJisEnterShapeProfile(previousProfileKey) || isJisEnterShapeProfile(profileKey);
  const nextParams = {};

  for (const key of listEditableParamKeys(profileKey)) {
    const shouldResetToProfileDefault = geometryTypeChanged && GEOMETRY_TYPE_RESET_FIELDS.has(key)
      || footprintTypeChanged && FOOTPRINT_RESET_FIELDS.has(key)
      || !previousVisibleFieldKeys.has(key)
      || !nextVisibleFieldKeys.has(key);
    const sourceValue = shouldResetToProfileDefault ? defaultParams[key] : state.keycapParams[key];
    nextParams[key] = sanitizeEditorParamValue(key, sourceValue, defaults[key], {
      ...state.keycapParams,
      ...nextParams,
      shapeProfile: profileKey,
    });
  }

  nextParams.name = state.keycapParams.name ?? defaultParams.name ?? defaults.name;
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
  state.editorSummary = t("status.loadedDirty");
  setExportStatus(
    "success",
    t("importExport.loaded", { fileName: file.name }),
    {
      format: "editor-data-import",
      label: t("importExport.loadLabel"),
      elapsedMs: Math.round(performance.now() - startedAt),
      byteLength: file.size,
      notes: t("importExport.loadNote", { fileName: file.name }),
    },
  );

  render({ animateInspector: true });
  await executeKeycapPreview({ silent: true });
}

async function importEditorDataFromDrop(files) {
  const jsonFile = files.find((file) => file.name.toLowerCase().endsWith(".json"));
  if (!jsonFile) {
    throw new Error(t("importExport.noJsonFile"));
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
      t("importExport.loadFailed"),
      {
        format: "editor-data-import",
        label: t("importExport.loadFailedLabel"),
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
  "typewriterMountHeight",
  "topHatTopWidth",
  "topHatTopDepth",
  "topHatInset",
  "topHatTopRadius",
  "topHatHeight",
  "topHatShoulderAngle",
  "topHatShoulderRadius",
]);

function syncFieldHint(fieldKey) {
  const input = app.querySelector(`[data-field="${fieldKey}"]`);
  const fieldConfig = getFieldConfig(fieldKey);
  const hint = input?.closest(".field")?.querySelector(".field-hint");

  if (hint && fieldConfig) {
    hint.textContent = resolveDynamicCopy(fieldConfig.hint);
  }
}

function syncFieldConstraintAttribute(input, attributeName, value) {
  if (value == null) {
    input.removeAttribute(attributeName);
    return;
  }

  input.setAttribute(attributeName, `${value}`);
}

function syncNumericFieldConstraints(input, fieldConfig) {
  syncFieldConstraintAttribute(input, "min", resolveFieldAttribute(fieldConfig?.min));
  syncFieldConstraintAttribute(input, "max", resolveFieldAttribute(fieldConfig?.max));
  syncFieldConstraintAttribute(input, "step", resolveFieldAttribute(fieldConfig?.step));
}

function isInputNumericallySynced(input, value) {
  const inputValue = String(input.value ?? "").trim();
  const inputNumber = Number(inputValue);
  const stateNumber = Number(value);
  return inputValue.length > 0
    && Number.isFinite(inputNumber)
    && Number.isFinite(stateNumber)
    && Math.abs(inputNumber - stateNumber) < 1e-9;
}

function syncVisibleTopFieldState(activeField = null) {
  TOP_LIVE_FIELD_KEYS.forEach((fieldKey) => {
    const input = app.querySelector(`[data-field="${fieldKey}"]`);
    const fieldConfig = getFieldConfig(fieldKey);
    if (!input) {
      return;
    }

    syncNumericFieldConstraints(input, fieldConfig);

    if (fieldKey !== activeField || !isInputNumericallySynced(input, state.keycapParams[fieldKey])) {
      input.value = formatNumericFieldValue(fieldKey, state.keycapParams[fieldKey]);
    }

    syncFieldHint(fieldKey);
  });
}

function getNumericFieldMinimum(fieldKey, fieldConfig) {
  if (fieldKey === "keySizeUnits" || fieldKey === "keyDepthUnits") {
    return 0.5;
  }

  if (fieldKey === "topHatTopWidthUnits" || fieldKey === "topHatTopDepthUnits") {
    return TOP_HAT_MIN_SIZE / getKeyUnitMm();
  }

  const minimum = Number(resolveFieldAttribute(fieldConfig?.min));
  return Number.isFinite(minimum) ? minimum : null;
}

function parseNumericInputValue(input, fieldKey, fieldConfig) {
  const rawValue = String(input.value ?? "").trim();
  if (rawValue.length === 0) {
    return null;
  }

  const nextValue = Number(rawValue);
  if (!Number.isFinite(nextValue)) {
    return null;
  }

  const minimum = getNumericFieldMinimum(fieldKey, fieldConfig);
  if (minimum != null && nextValue < minimum) {
    return null;
  }

  return nextValue;
}

function setKeyUnitBasisInputValidity(input, isValid) {
  input.setAttribute("aria-invalid", isValid ? "false" : "true");
  input.closest(".field-control")?.classList.toggle("is-invalid", !isValid);
}

function parseKeyUnitBasisInput(input) {
  const rawValue = String(input.value ?? "").trim();
  if (rawValue.length === 0) {
    return null;
  }

  const nextValue = Number(rawValue);
  return Number.isFinite(nextValue) && nextValue >= KEY_UNIT_MIN_MM ? nextValue : null;
}

function syncKeyUnitBasisCopy() {
  const description = app.querySelector("[data-key-unit-description]");
  if (description) {
    description.textContent = t("unitBasis.description", getKeyUnitCopyValues());
  }

  const readout = app.querySelector("[data-key-unit-readout]");
  if (readout) {
    readout.textContent = renderKeyUnitBasisReadout();
  }
}

function syncUnitLinkedFieldHints() {
  syncFieldHint("keyWidth");
  syncFieldHint("keyDepth");
}

function syncAllLinkedSizeInputs() {
  Object.values(LINKED_SIZE_UNIT_FIELDS).forEach((primaryField) => {
    syncLinkedSizeInputs(primaryField);
  });
}

function handleKeyUnitBasisInput(input, options = {}) {
  const { commit = false } = options;
  const nextValue = parseKeyUnitBasisInput(input);
  if (nextValue == null) {
    setKeyUnitBasisInputValidity(input, false);
    if (commit) {
      input.value = formatKeyUnitMmInputValue();
      setKeyUnitBasisInputValidity(input, true);
    }
    return;
  }

  state.keyUnitMm = sanitizeKeyUnitMm(nextValue);
  saveKeyUnitMmPreference(state.keyUnitMm);
  setKeyUnitBasisInputValidity(input, true);
  if (commit) {
    input.value = formatKeyUnitMmInputValue();
  }

  syncKeyUnitBasisCopy();
  syncUnitLinkedFieldHints();
  syncAllLinkedSizeInputs();
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

function applyTopSurfaceShapePreset(surfaceShape) {
  const preset = getTopSurfaceShapePreset(surfaceShape);
  state.keycapParams.dishDepth = preset.dishDepth;
}

function handleFieldChange(event) {
  const field = event.currentTarget.dataset.field;
  const input = event.currentTarget;
  const deferPreview = event.deferPreview === true;
  const fieldConfig = getFieldConfig(field);
  if (!field || !input) {
    return;
  }

  if (field in LINKED_SIZE_UNIT_FIELDS) {
    const nextValue = parseNumericInputValue(input, field, fieldConfig);
    if (nextValue == null) {
      return;
    }

    state.keycapParams[LINKED_SIZE_UNIT_FIELDS[field]] = nextValue * getKeyUnitMm();
    syncLinkedSizeInputs(field);
  } else if (input.type === "checkbox") {
    state.keycapParams[field] = input.checked;
  } else if (input.tagName === "SELECT") {
    if (field === "shapeProfile") {
      applyShapeProfileParams(input.value);
    } else {
      state.keycapParams[field] = input.value;
      if (field === "topSurfaceShape") {
        applyTopSurfaceShapePreset(input.value);
      }
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
    const nextValue = parseNumericInputValue(input, field, fieldConfig);
    if (nextValue == null) {
      return;
    }

    if (isTopEdgeHeightField(field)) {
      applyTopEdgeHeightChange(field, nextValue);
    } else {
      state.keycapParams[field] = nextValue;
    }

    if (Object.values(LINKED_SIZE_UNIT_FIELDS).includes(field)) {
      syncLinkedSizeInputs(field);
    }
  }

  syncDerivedKeycapParams(state.keycapParams);
  const changedPrimaryField = LINKED_SIZE_UNIT_FIELDS[field] ?? field;
  if (field in LINKED_SIZE_UNIT_FIELDS || Object.values(LINKED_SIZE_UNIT_FIELDS).includes(field)) {
    syncLinkedSizeInputs(field);
  }

  if (
    TOP_LIVE_FIELD_KEYS.has(field)
    || TOP_LIVE_FIELD_KEYS.has(changedPrimaryField)
    || changedPrimaryField === "topScale"
    || changedPrimaryField === "keyWidth"
    || changedPrimaryField === "keyDepth"
    || changedPrimaryField === "jisEnterNotchWidth"
    || changedPrimaryField === "jisEnterNotchDepth"
  ) {
    syncVisibleTopFieldState(field);
  }

  if (input.type === "checkbox") {
    input.parentElement?.querySelector("span:last-child")?.replaceChildren(input.checked ? t("actions.on") : t("actions.off"));
  }

  state.editorStatus = "dirty";
  state.editorSummary = t("status.dirty");

  if (
    field === "legendEnabled"
    || SIDE_LEGEND_CONFIGS.some((config) => field === legendParamKey(config.paramPrefix, LEGEND_FIELD_SUFFIXES.enabled))
    || field === "homingBarEnabled"
    || field === "rimEnabled"
    || field === "topHatEnabled"
    || field === "topSurfaceShape"
    || field === "topSlopeInputMode"
    || EDITOR_SELECTOR_KEYS.includes(field)
  ) {
    render({ animateInspector: true });
  }

  if (field === "dishDepth") {
    syncFieldHint("topCenterHeight");
  }

  if (changedPrimaryField === "keyWidth") {
    syncFieldHint("jisEnterNotchWidth");
    syncFieldHint("typewriterCornerRadius");
    syncFieldHint("rimWidth");
    syncFieldHint("topHatTopWidth");
    syncFieldHint("topHatInset");
    syncFieldHint("topHatTopRadius");
    syncFieldHint("topHatShoulderRadius");
  }

  if (changedPrimaryField === "keyDepth") {
    syncFieldHint("jisEnterNotchDepth");
    syncFieldHint("typewriterCornerRadius");
    syncFieldHint("rimWidth");
    syncFieldHint("topHatTopDepth");
    syncFieldHint("topHatInset");
    syncFieldHint("topHatTopRadius");
    syncFieldHint("topHatShoulderRadius");
  }

  if (changedPrimaryField === "jisEnterNotchWidth" || changedPrimaryField === "jisEnterNotchDepth") {
    syncFieldHint("typewriterCornerRadius");
    syncFieldHint("rimWidth");
    syncFieldHint("topHatInset");
    syncFieldHint("topHatTopRadius");
    syncFieldHint("topHatHeight");
    syncFieldHint("topHatShoulderRadius");
  }

  if (changedPrimaryField === "topScale" || changedPrimaryField === "topHatTopWidth" || changedPrimaryField === "topHatTopDepth" || changedPrimaryField === "topHatInset" || changedPrimaryField === "topHatShoulderAngle") {
    syncFieldHint("topHatTopWidth");
    syncFieldHint("topHatTopDepth");
    syncFieldHint("topHatInset");
    syncFieldHint("topHatTopRadius");
    syncFieldHint("topHatHeight");
    syncFieldHint("topHatShoulderRadius");
  }

  if (field === "topHatHeight") {
    syncFieldHint("topHatShoulderRadius");
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

function syncLinkedSizeInputs(changedField) {
  const changedPrimaryField = LINKED_SIZE_UNIT_FIELDS[changedField] ?? changedField;
  const changedUnitField = Object.entries(LINKED_SIZE_UNIT_FIELDS)
    .find(([, primaryField]) => primaryField === changedPrimaryField)?.[0];
  const primaryFieldConfig = getFieldConfig(changedPrimaryField);
  const primaryInput = app.querySelector(`[data-field="${changedPrimaryField}"]`);
  const unitInput = changedUnitField ? app.querySelector(`[data-field="${changedUnitField}"]`) : null;

  if (LINKED_SIZE_UNIT_FIELDS[changedField] && primaryInput) {
    primaryInput.value = formatNumericFieldValue(changedPrimaryField, state.keycapParams[changedPrimaryField]);
  }

  if (!unitInput) {
    syncKeyUnitBasisCopy();
    return;
  }

  syncFieldConstraintAttribute(unitInput, "min", resolveFieldAttribute(primaryFieldConfig?.secondaryMin));
  syncFieldConstraintAttribute(unitInput, "step", resolveFieldAttribute(primaryFieldConfig?.secondaryStep));

  const syncedUnitValue = formatUnitInputValue(state.keycapParams[changedPrimaryField]);
  if (changedField === changedPrimaryField || !isInputNumericallySynced(unitInput, syncedUnitValue)) {
    unitInput.value = syncedUnitValue;
  }

  syncKeyUnitBasisCopy();
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
        ${t("preview.placeholder")}
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
      ...SIDE_LEGEND_CONFIGS
        .filter((config) => isSideLegendRenderable(config))
        .map((config) => createColorLayerJob({
          name: `legend-${config.side}`,
          exportTarget: config.exportTarget,
          outputPath: config.outputPath,
          colorFieldKey: config.colorFieldKey,
        })),
    ];
  }

  throw new Error(t("errors.unsupportedOffPurpose", { purpose }));
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
  state.editorSummary = t("preview.running");
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
    state.editorSummary = t("preview.summary", {
      elapsedMs: Math.round(totalElapsedMs),
      objectCount: previewResults.length,
      vertexCount: totalVertices,
      faceCount: totalFaces,
    });
    state.editorLogs = previewResults.flatMap((entry) =>
      entry.result.logs.map((log) => `[${entry.name}/${log.stream}] ${log.text}`),
    );
    state.editorError = previewResults.length > 1
      ? t("preview.successMultiple", { parts: visiblePartLabels })
      : t("preview.successSingle", { parts: visiblePartLabels });
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
    state.editorSummary = t("preview.failed");
    state.editorLogs = [];
    state.editorError = `${error}`;
    state.previewLayers = [];
  }

  renderPreviewViewer();
}

async function executeExport(format) {
  state.exportsStatus = "running";
  state.exportsSummary = t("importExport.preparing");
  render();

  try {
    if (format === "editor-data") {
      const startedAt = performance.now();
      const payload = createEditorDataPayload(state.keycapParams);
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, buildEditorDataFilename(payload.params));
      setExportStatus(
        "success",
        t("importExport.savedEditorData", { byteLength: blob.size }),
        {
          format,
          label: t("importExport.editorDataLabel"),
          elapsedMs: Math.round(performance.now() - startedAt),
          byteLength: blob.size,
          notes: t("importExport.editorDataNote"),
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
        {
          assemblyName: sanitizeExportBaseName(state.keycapParams.name),
        },
      );
      downloadBlob(blob, build3mfFilename());

      setExportStatus(
        "success",
        t("importExport.savedThreeMf", { byteLength: blob.size, partCount: offResults.length }),
        {
          format,
          label: t("importExport.threeMfLabel"),
          elapsedMs: Math.round(offResults.reduce((sum, entry) => sum + entry.result.elapsedMs, 0)),
          byteLength: blob.size,
          notes: t("importExport.threeMfNote", { parts: savedPartLabels }),
        },
      );
    } else if (format === "stl") {
      const result = await runOpenScad({
        files: await createKeycapFiles({
          params: state.keycapParams,
          exportTarget: "single_material_shape",
        }),
        args: buildKeycapArgs({
          outputPath: keycapStlExportPath,
          outputFormat: "stl",
        }),
        outputPaths: [keycapStlExportPath],
      });
      const [output] = result.outputs;
      const blob = new Blob([output.bytes], { type: "model/stl" });
      downloadBlob(blob, buildStlFilename());

      setExportStatus(
        "success",
        t("importExport.savedStl", { byteLength: blob.size }),
        {
          format,
          label: t("importExport.stlLabel"),
          elapsedMs: Math.round(result.elapsedMs),
          byteLength: blob.size,
          notes: t("importExport.stlNote"),
        },
      );
    } else {
      throw new Error(t("importExport.unsupportedExport", { format }));
    }
  } catch (error) {
    setExportStatus(
      "error",
      t("importExport.saveFailed"),
      {
        format,
        label: t("importExport.saveFailedLabel"),
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
