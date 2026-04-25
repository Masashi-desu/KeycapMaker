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
const TYPEWRITER_MIN_STEM_HEIGHT = 0.6;
const TYPEWRITER_STEM_MOUNT_OVERLAP = 0.02;
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
    ? t("fields.legendFontKey.variableHint")
    : t("fields.legendFontKey.staticHint");
}

function getLegendFontStyleFieldOptions(params = state.keycapParams) {
  const nativeStyleOptions = getKeycapLegendFontStyleOptions(params.legendFontKey);
  if (nativeStyleOptions.length === 0) {
    return [{ value: LEGEND_FONT_STYLE_FALLBACK_KEY, label: t("font.defaultStyleLabel") }];
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

function getTypewriterCornerRadiusHint(params) {
  const maxRadius = Math.max(Math.min(Number(params.keyWidth ?? 0), Number(params.keyDepth ?? 0)) / 2, 0);
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

const fieldGroupTemplates = [
  {
    id: "shape",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.shape.title"),
    description: (params) => (
      isTypewriterShapeProfile(params.shapeProfile)
        ? t("fieldGroups.shapeDescriptionTypewriter")
        : t("fieldGroups.shapeDescriptionShell")
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
        hint: () => t("fields.keyWidth.hint"),
        type: "linked-size",
        unit: "mm",
        step: 0.1,
        min: 10,
        secondaryLabel: () => t("fields.keyWidth.secondaryLabel"),
        secondaryField: "keySizeUnits",
        secondaryUnit: "u",
        secondaryStep: 0.05,
        secondaryMin: 0.5,
      },
      { key: "keyDepth", label: () => t("fields.keyDepth.label"), hint: () => t("fields.keyDepth.hint"), unit: "mm", step: 0.1, min: 10 },
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
      { key: "legendEnabled", label: () => t("fields.legendEnabled.label"), hint: () => t("fields.legendEnabled.hint"), type: "checkbox" },
      {
        key: "legendText",
        label: () => t("fields.legendText.label"),
        hint: () => t("fields.legendText.hint"),
        type: "text",
        maxLength: 24,
        placeholder: () => t("fields.legendText.placeholder"),
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendFontKey",
        label: () => t("fields.legendFontKey.label"),
        hint: (params) => getLegendFontFieldHint(params),
        type: "font-search",
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendFontStyleKey",
        label: () => t("fields.legendFontStyleKey.label"),
        hint: (params) => getLegendFontStyleHint(params),
        type: "select",
        options: (params) => getLegendFontStyleFieldOptions(params),
        disabledWhen: (params) => !isLegendFontStyleSelectable(params),
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendUnderlineEnabled",
        label: () => t("fields.legendUnderlineEnabled.label"),
        hint: () => t("fields.legendUnderlineEnabled.hint"),
        type: "checkbox",
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendSize",
        label: () => t("fields.legendSize.label"),
        hint: () => t("fields.legendSize.hint"),
        unit: "mm",
        step: 0.1,
        min: LEGEND_MIN_SIZE,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendOutlineDelta",
        label: () => t("fields.legendOutlineDelta.label"),
        hint: () => getLegendOutlineHint(),
        unit: "mm",
        step: 0.02,
        min: LEGEND_OUTLINE_MIN,
        max: LEGEND_OUTLINE_MAX,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendHeight",
        label: () => t("fields.legendHeight.label"),
        hint: () => t("fields.legendHeight.hint"),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendEmbed",
        label: () => t("fields.legendEmbed.label"),
        hint: () => t("fields.legendEmbed.hint"),
        unit: "mm",
        step: 0.05,
        min: 0,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendColor",
        label: () => t("fields.legendColor.label"),
        hint: () => t("fields.legendColor.hint"),
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.legendColor,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendOffsetX",
        label: () => t("fields.legendOffsetX.label"),
        hint: () => t("fields.legendOffsetX.hint"),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.legendEnabled,
      },
      {
        key: "legendOffsetY",
        label: () => t("fields.legendOffsetY.label"),
        hint: () => t("fields.legendOffsetY.hint"),
        unit: "mm",
        step: 0.1,
        visibleWhen: (params) => params.legendEnabled,
      },
    ],
  },
  {
    id: "homing",
    title: () => t("shapeProfiles.custom-shell.fieldGroups.homing.title"),
    description: () => t("shapeProfiles.custom-shell.fieldGroups.homing.description"),
    fields: [
      { key: "homingBarEnabled", label: () => t("fields.homingBarEnabled.label"), hint: () => t("fields.homingBarEnabled.hint"), type: "checkbox" },
      {
        key: "homingBarLength",
        label: () => t("fields.homingBarLength.label"),
        hint: () => t("fields.homingBarLength.hint"),
        unit: "mm",
        step: 0.1,
        min: 0.5,
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
      {
        key: "homingBarBaseThickness",
        label: () => t("fields.homingBarBaseThickness.label"),
        hint: () => t("fields.homingBarBaseThickness.hint"),
        unit: "mm",
        step: 0.05,
        min: 0.05,
        visibleWhen: (params) => params.homingBarEnabled,
      },
      {
        key: "homingBarColor",
        label: () => t("fields.homingBarColor.label"),
        hint: () => t("fields.homingBarColor.hint"),
        type: "color",
        placeholder: DEFAULT_KEYCAP_COLORS.homingBarColor,
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
  return getShapeProfileFieldGroups(profileKey)
    .map((group) => ({
      ...group,
      title: t(`shapeProfiles.${profileKey}.fieldGroups.${group.id}.title`, {}, resolveDynamicCopy(group.title)),
      fields: (group.fieldKeys ?? [])
        .map((fieldKey) => getFieldConfig(fieldKey, profileKey))
        .filter(Boolean),
      description: group.descriptionKey != null
        ? (FIELD_GROUP_DESCRIPTION_RESOLVERS[group.descriptionKey] ?? group.description ?? "")
        : t(`shapeProfiles.${profileKey}.fieldGroups.${group.id}.description`, {}, resolveDynamicCopy(group.description)),
    }));
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
  editorStatus: "idle",
  editorSummary: translate(initialLocale, "status.notGenerated"),
  editorLogs: [],
  editorError: "",
  previewLayers: [],
  sidebarTab: "params",
  isImportDragActive: false,
  legendFontPickerOpen: false,
  legendFontPickerQuery: "",
  copiedFontAttributionKey: "",
  collapsedFieldGroups: createFieldGroupCollapseState(),
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

  return `
    <section class="field-group-card" style="view-transition-name: ${groupViewTransitionName};">
      <div class="field-group-header">
        <div class="field-group-header__row">
          <h3>${t("nameGroup.title")}</h3>
        </div>
      </div>
      <div class="field-group-body">
        <p class="field-group-description">${t("nameGroup.description")}</p>
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

function renderFieldGroup(group, groupIndex) {
  const groupId = group.id ?? `group-${groupIndex}`;
  const isCollapsed = state.collapsedFieldGroups[groupId] === true;
  const groupViewTransitionName = createViewTransitionName("field-group", groupId);
  const groupBodyId = `field-group-body-${groupId}`;
  const groupFieldByKey = new Map(group.fields.map((field) => [field.key, field]));
  const dependentFieldKeys = getVisibleDependentFieldKeys(group.fields, groupFieldByKey);
  const visibleFields = group.fields.filter((field) => isFieldVisible(field) && !dependentFieldKeys.has(field.key));
  const toggleLabel = isCollapsed
    ? t("fieldGroup.expand", { title: group.title })
    : t("fieldGroup.collapse", { title: group.title });
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
          ${visibleFields.map((field) => renderFieldWithDependents(field, groupFieldByKey)).join("")}
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

function canRenderDependentFields(field) {
  return field.type === "select";
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

  return renderFieldWithDependentFields(field, dependentFields);
}

function renderFieldWithDependentFields(field, dependentFields) {
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
      ${dependentFields.length > 0 ? `
        <div class="field-dependent-list">
          ${dependentFields.map((dependentField) => renderField(dependentField, { className: "field--dependent" })).join("")}
        </div>
      ` : ""}
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

function renderLegendFontPickerOptions() {
  const matchingFonts = getLegendFontPickerResults();
  if (matchingFonts.length === 0) {
    return `<div class="font-picker-empty">${t("font.noResults")}</div>`;
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

function renderField(field, options = {}) {
  const value = state.keycapParams[field.key];
  const fieldViewTransitionName = createViewTransitionName("field", field.key);
  const fieldLabel = resolveDynamicCopy(field.label);
  const fieldHint = resolveDynamicCopy(field.hint);
  const secondaryLabel = resolveDynamicCopy(field.secondaryLabel);
  const fieldPlaceholder = resolveDynamicCopy(field.placeholder);
  const fieldOptions = resolveFieldOptions(field);
  const isDisabled = isFieldDisabled(field);
  const fieldClassName = options.className ? ` ${options.className}` : "";

  if (field.type === "checkbox") {
    return `
      <label class="field field--checkbox${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
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
      <label class="field field--font-search ${isPickerOpen ? "is-open" : ""}${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
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
                    data-font-picker-query
                    value="${escapeHtml(state.legendFontPickerQuery)}"
                    placeholder="${escapeHtml(t("font.searchPlaceholder"))}"
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
    return `
      <label class="field field--linked-size${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
        <span class="field-copy">
          <span class="field-label">${fieldLabel}</span>
          <span class="field-hint">${fieldHint}</span>
        </span>
        <span class="field-control-cluster">
          <span class="field-mini-control">
            <span class="field-mini-control__label">${t("fields.keyWidth.miniLabel")}</span>
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
    <label class="field${fieldClassName}" style="view-transition-name: ${fieldViewTransitionName};">
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
  syncDerivedKeycapParams(state.keycapParams);
  state.editorStatus = "dirty";
  state.editorSummary = t("status.dirty");
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
    state.legendFontPickerOpen
    && event.target instanceof Element
    && !event.target.closest("[data-font-picker]")
  ) {
    state.legendFontPickerOpen = false;
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

  if (state.legendFontPickerOpen) {
    state.legendFontPickerOpen = false;
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
  const nextParams = {};

  for (const key of listEditableParamKeys(profileKey)) {
    const shouldResetToProfileDefault = geometryTypeChanged && GEOMETRY_TYPE_RESET_FIELDS.has(key)
      || !previousVisibleFieldKeys.has(key)
      || !nextVisibleFieldKeys.has(key);
    const sourceValue = shouldResetToProfileDefault ? defaultParams[key] : state.keycapParams[key];
    nextParams[key] = sanitizeEditorParamValue(key, sourceValue, defaults[key], state.keycapParams);
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

function getNumericFieldMinimum(fieldKey, fieldConfig) {
  if (fieldKey === "keySizeUnits") {
    return 0.5;
  }

  const minimum = Number(fieldConfig?.min);
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

  if (field === "keySizeUnits") {
    const nextValue = parseNumericInputValue(input, field, fieldConfig);
    if (nextValue == null) {
      return;
    }

    state.keycapParams.keyWidth = nextValue * KEY_UNIT_MM;
    syncLinkedShapeInputs("keySizeUnits");
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

    if (field === "keyWidth") {
      syncLinkedShapeInputs("keyWidth");
    }
  }

  syncDerivedKeycapParams(state.keycapParams);

  if (
    TOP_LIVE_FIELD_KEYS.has(field)
    || field === "topScale"
    || field === "keyWidth"
    || field === "keyDepth"
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
    || field === "homingBarEnabled"
    || field === "rimEnabled"
    || field === "topSurfaceShape"
    || field === "topSlopeInputMode"
    || EDITOR_SELECTOR_KEYS.includes(field)
  ) {
    render({ animateInspector: true });
  }

  if (field === "dishDepth") {
    syncFieldHint("topCenterHeight");
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
