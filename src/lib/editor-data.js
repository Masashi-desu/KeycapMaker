import keycapEditorProfiles, {
  createDefaultKeycapParams,
  DEFAULT_SHAPE_PROFILE_KEY,
  EDITOR_SELECTOR_KEYS,
  getShapeProfileGeometryDefaults,
  resolveShapeGeometryType,
  SHAPE_PROFILE_MAP,
} from "../data/keycap-shape-registry.js";
import { normalizeHexColor } from "./color-utils.js";
import {
  DEFAULT_KEYCAP_LEGEND_FONT_KEY,
  getKeycapLegendFontStyleOptions,
  resolveKeycapLegendFont,
} from "./keycap-fonts.js";

export const DEFAULT_EXPORT_BASE_NAME = "keycap-preview";
export const EDITOR_DATA_KIND = "keycap-maker/editor-params";
export const LEGACY_EDITOR_DATA_KINDS = new Set([EDITOR_DATA_KIND.replace("keycap-maker", "keycap" + "s-maker")]);
export const EDITOR_DATA_SCHEMA_VERSION = 4;
export const EDITOR_DATA_COMPAT_KIND = "keycap-maker/editor-params-patch";
export const EDITOR_DATA_COMPAT_SCHEMA_VERSION = 1;

const STEM_TYPE_VALUES = new Set(["none", "mx", "choc_v1", "choc_v2", "alps"]);
const TOP_SLOPE_INPUT_MODE_VALUES = new Set(["angle", "edge-height"]);
const TOP_SURFACE_SHAPE_VALUES = new Set(["flat", "cylindrical", "spherical"]);
const TYPEWRITER_TOP_SURFACE_SHAPE_VALUES = new Set(["flat", "spherical"]);
const TOP_SURFACE_SHAPE_PRESETS = Object.freeze({
  flat: Object.freeze({
    dishDepth: 0,
  }),
  cylindrical: Object.freeze({
    dishDepth: 0.7,
  }),
  spherical: Object.freeze({
    dishDepth: 1.0,
  }),
});
const COLOR_FIELD_KEYS = new Set(["bodyColor", "rimColor", "legendColor", "homingBarColor"]);
const LEGEND_MIN_SIZE = 0.5;
const LEGEND_OUTLINE_MIN = -1.2;
const LEGEND_OUTLINE_MAX = 1.2;
const LEGEND_FONT_STYLE_FALLBACK_KEY = "font-default";
const TYPEWRITER_MIN_STEM_HEIGHT = 0.6;
const TYPEWRITER_STEM_MOUNT_OVERLAP = 0.02;
const RESERVED_COMPAT_PAYLOAD_KEYS = new Set(["kind", "schemaVersion", "profileSchemaVersion", "savedAt", "selectors", "params"]);
const KNOWN_EDITOR_PARAM_KEYS = Object.freeze(
  Array.from(new Set(keycapEditorProfiles.profiles.flatMap((profile) => Object.keys(profile.defaults ?? {})))),
);
const KNOWN_EDITOR_PARAM_KEY_SET = new Set(KNOWN_EDITOR_PARAM_KEYS);

function getPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function isRecognizedShapeProfileKey(profileKey) {
  return SHAPE_PROFILE_MAP.has(profileKey);
}

function isTypewriterGeometryType(geometryType) {
  return geometryType === "typewriter" || geometryType === "typewriter_jis_enter";
}

function isJisEnterGeometryType(geometryType) {
  return geometryType === "jis_enter" || geometryType === "typewriter_jis_enter";
}

function resolveLegendFontConfig(fontKey = DEFAULT_KEYCAP_LEGEND_FONT_KEY) {
  return resolveKeycapLegendFont(fontKey);
}

function getLegendFontStyleFieldOptions(legendFontKey = DEFAULT_KEYCAP_LEGEND_FONT_KEY) {
  const nativeStyleOptions = getKeycapLegendFontStyleOptions(legendFontKey);
  if (nativeStyleOptions.length === 0) {
    return [{ value: LEGEND_FONT_STYLE_FALLBACK_KEY, label: "フォント名どおり" }];
  }

  return nativeStyleOptions.map((option) => ({
    value: option.key,
    label: option.label,
  }));
}

function clampMinimum(value, fallback, minimum) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, minimum) : fallback;
}

function clampPositiveDimension(value, fallback, minimum = 1) {
  const nextValue = Number(value);
  const fallbackValue = Number(fallback);
  const resolvedFallback = Number.isFinite(fallbackValue) && fallbackValue > 0
    ? fallbackValue
    : minimum;

  return Number.isFinite(nextValue) && nextValue > 0
    ? Math.max(nextValue, minimum)
    : Math.max(resolvedFallback, minimum);
}

function degTan(value) {
  return Math.tan((Number(value) * Math.PI) / 180);
}

function resolveTopSlopeInputMode(value, fallback = "angle") {
  return TOP_SLOPE_INPUT_MODE_VALUES.has(value) ? value : fallback;
}

function resolveTopSurfaceShape(value, fallback = "flat") {
  if (TOP_SURFACE_SHAPE_VALUES.has(value)) {
    return value;
  }

  return TOP_SURFACE_SHAPE_VALUES.has(fallback) ? fallback : "flat";
}

function getAllowedTopSurfaceShapeValues(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return isTypewriterGeometryType(resolveShapeGeometryType(profileKey))
    ? TYPEWRITER_TOP_SURFACE_SHAPE_VALUES
    : TOP_SURFACE_SHAPE_VALUES;
}

function resolveProfileTopSurfaceShape(profileKey, value, fallback = "flat") {
  const allowedValues = getAllowedTopSurfaceShapeValues(profileKey);
  const resolvedValue = resolveTopSurfaceShape(value, fallback);
  if (allowedValues.has(resolvedValue)) {
    return resolvedValue;
  }

  const resolvedFallback = resolveTopSurfaceShape(fallback, "flat");
  return allowedValues.has(resolvedFallback) ? resolvedFallback : "flat";
}

export function getTopSurfaceShapePreset(value, fallback = "flat") {
  const resolvedShape = resolveTopSurfaceShape(value, fallback);
  const preset = TOP_SURFACE_SHAPE_PRESETS[resolvedShape] ?? TOP_SURFACE_SHAPE_PRESETS.flat;
  return {
    dishDepth: preset.dishDepth,
  };
}

function inferLegacyTopSurfaceShape(params = {}) {
  const dishDepth = Number(params.dishDepth ?? 0);
  if (params.topSurfaceShape != null || !Number.isFinite(dishDepth) || Math.abs(dishDepth) <= 0.001) {
    return null;
  }

  return "spherical";
}

function resolveActiveDishDepth(params = {}) {
  const dishDepth = Number(params.dishDepth ?? 0);
  if (!Number.isFinite(dishDepth)) {
    return 0;
  }

  return resolveProfileTopSurfaceShape(params.shapeProfile, params.topSurfaceShape, "flat") === "flat" ? 0 : dishDepth;
}

function clampTypewriterCornerRadius(value, fallback = 0, params = {}) {
  return clampTypewriterCornerRadiusForParams(value, params, fallback);
}

function getJisEnterFootprintLimits(params = {}) {
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

function getTypewriterCornerRadiusMax(params = {}) {
  const keyWidth = Math.max(Number(params.keyWidth ?? 0), 0);
  const keyDepth = Math.max(Number(params.keyDepth ?? 0), 0);
  if (isJisEnterGeometryType(resolveShapeGeometryType(params.shapeProfile))) {
    const limits = getJisEnterFootprintLimits(params);
    return Math.max(Math.min(
      limits.keyWidth,
      limits.keyDepth,
      limits.lowerBodyWidth,
      limits.upperBodyDepth,
    ) / 2, 0);
  }

  return Math.max(Math.min(keyWidth, keyDepth) / 2, 0);
}

function clampTypewriterCornerRadiusForParams(value, params = {}, fallback = 0) {
  const maxRadius = getTypewriterCornerRadiusMax(params);
  const nextValue = Number(value);
  const fallbackValue = Math.min(Math.max(Number(fallback) || 0, 0), maxRadius);
  if (!Number.isFinite(nextValue)) {
    return fallbackValue;
  }

  return Math.min(Math.max(nextValue, 0), maxRadius);
}

function clampNonNegativeNumber(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.max(Number(fallback) || 0, 0);
  }

  return Math.max(nextValue, 0);
}

function getTypewriterRimMaxWidth(params = {}) {
  if (isJisEnterGeometryType(resolveShapeGeometryType(params.shapeProfile))) {
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

function clampTypewriterRimWidth(value, params = {}, fallback = 0) {
  const maxWidth = getTypewriterRimMaxWidth(params);
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.min(Math.max(Number(fallback) || 0, 0), maxWidth);
  }

  return Math.min(Math.max(nextValue, 0), maxWidth);
}

function getJisEnterNotchWidthMax(params = {}) {
  return Math.max(Number(params.keyWidth ?? 0) - 0.2, 0);
}

function getJisEnterNotchDepthMax(params = {}) {
  return Math.max(Number(params.keyDepth ?? 0) - 0.2, 0);
}

function clampJisEnterNotchDimension(value, maxValue, fallback = 0) {
  const nextValue = Number(value);
  const fallbackValue = Number(fallback);
  const resolvedFallback = Number.isFinite(fallbackValue) ? Math.max(fallbackValue, 0) : 0;
  if (!Number.isFinite(nextValue)) {
    return Math.min(resolvedFallback, maxValue);
  }

  return Math.min(Math.max(nextValue, 0), maxValue);
}

function clampJisEnterNotchWidth(value, params = {}, fallback = 0) {
  return clampJisEnterNotchDimension(value, getJisEnterNotchWidthMax(params), fallback);
}

function clampJisEnterNotchDepth(value, params = {}, fallback = 0) {
  return clampJisEnterNotchDimension(value, getJisEnterNotchDepthMax(params), fallback);
}

function getTypewriterMountHeightMinimum(params = {}) {
  const topCenterHeight = clampMinimum(params.topCenterHeight, 5.2, 0.1);
  return topCenterHeight + TYPEWRITER_MIN_STEM_HEIGHT - TYPEWRITER_STEM_MOUNT_OVERLAP;
}

function clampTypewriterMountHeight(value, params = {}, fallback = 0) {
  const minimum = getTypewriterMountHeightMinimum(params);
  const fallbackValue = Number(fallback);
  const nextValue = Number(value);
  const resolvedFallback = Number.isFinite(fallbackValue) && fallbackValue > 0
    ? fallbackValue
    : minimum;

  return Math.max(Number.isFinite(nextValue) ? nextValue : resolvedFallback, minimum);
}

function clampLegendOutlineDelta(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return Math.min(Math.max(nextValue, LEGEND_OUTLINE_MIN), LEGEND_OUTLINE_MAX);
}

function clampLegendSize(value, fallback = LEGEND_MIN_SIZE) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, LEGEND_MIN_SIZE) : fallback;
}

function isSupportedStemType(stemType) {
  return STEM_TYPE_VALUES.has(stemType);
}

function resolveDefaultStemType(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const defaults = createDefaultKeycapParams(profileKey);
  return isSupportedStemType(defaults.stemType) ? defaults.stemType : "choc_v2";
}

export function resolveStemType(params = {}) {
  if (isSupportedStemType(params.stemType)) {
    return params.stemType;
  }

  return resolveDefaultStemType(params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY);
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

  if (isTypewriterGeometryType(geometryDefaults.geometryType)) {
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
  const activeDishDepth = resolveActiveDishDepth(params);

  return {
    topFrontHeight: geometry.topCenterHeight + geometry.topFront * pitchSlope,
    topBackHeight: geometry.topCenterHeight + geometry.topBack * pitchSlope,
    topLeftHeight: geometry.topCenterHeight + geometry.topLeft * rollSlope,
    topRightHeight: geometry.topCenterHeight + geometry.topRight * rollSlope,
    topVisibleCenterHeight: geometry.topCenterHeight - activeDishDepth,
  };
}

function syncLegendFontParams(params = {}) {
  params.legendFontKey = resolveLegendFontConfig(params.legendFontKey).key;
  const styleOptions = getLegendFontStyleFieldOptions(params.legendFontKey);
  const fallbackStyleKey = styleOptions[0]?.value ?? LEGEND_FONT_STYLE_FALLBACK_KEY;
  const allowedStyleKeys = new Set(styleOptions.map((option) => option.value));
  params.legendFontStyleKey = allowedStyleKeys.has(params.legendFontStyleKey)
    ? params.legendFontStyleKey
    : fallbackStyleKey;
  params.legendOutlineDelta = clampLegendOutlineDelta(params.legendOutlineDelta, 0);
  return params;
}

export function syncDerivedKeycapParams(params = {}) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const defaultLegendSize = clampLegendSize(
    defaults.legendSize,
    LEGEND_MIN_SIZE,
  );

  params.keyWidth = clampPositiveDimension(params.keyWidth, defaults.keyWidth ?? 18);
  params.keyDepth = clampPositiveDimension(params.keyDepth, defaults.keyDepth ?? 18);
  params.topCenterHeight = clampMinimum(params.topCenterHeight, defaults.topCenterHeight ?? 9.5, 0.1);
  params.topPitchDeg = Number.isFinite(Number(params.topPitchDeg)) ? Number(params.topPitchDeg) : Number(defaults.topPitchDeg ?? 0);
  params.topRollDeg = Number.isFinite(Number(params.topRollDeg)) ? Number(params.topRollDeg) : Number(defaults.topRollDeg ?? 0);
  params.topSlopeInputMode = resolveTopSlopeInputMode(params.topSlopeInputMode, resolveTopSlopeInputMode(defaults.topSlopeInputMode));
  params.topSurfaceShape = resolveProfileTopSurfaceShape(
    profileKey,
    params.topSurfaceShape,
    resolveProfileTopSurfaceShape(profileKey, defaults.topSurfaceShape, "flat"),
  );
  params.typewriterCornerRadius = clampTypewriterCornerRadius(
    params.typewriterCornerRadius,
    defaults.typewriterCornerRadius ?? getTypewriterCornerRadiusMax(params),
    params,
  );
  const geometryType = resolveShapeGeometryType(profileKey);
  if (isTypewriterGeometryType(geometryType)) {
    params.typewriterMountHeight = clampTypewriterMountHeight(
      params.typewriterMountHeight,
      params,
      defaults.typewriterMountHeight ?? 0,
    );
  }
  if (isJisEnterGeometryType(geometryType)) {
    params.jisEnterNotchWidth = clampJisEnterNotchWidth(
      params.jisEnterNotchWidth,
      params,
      defaults.jisEnterNotchWidth ?? 0,
    );
    params.jisEnterNotchDepth = clampJisEnterNotchDepth(
      params.jisEnterNotchDepth,
      params,
      defaults.jisEnterNotchDepth ?? 0,
    );
  }
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

export function sanitizeExportBaseName(value, fallback = DEFAULT_EXPORT_BASE_NAME) {
  const fallbackValue = String(fallback ?? "").trim() || DEFAULT_EXPORT_BASE_NAME;
  const normalized = String(value ?? "")
    .trim()
    .replace(/\.(json|3mf|stl)$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return normalized || fallbackValue;
}

export function pickEditorSelectors(params = {}) {
  return Object.fromEntries(
    EDITOR_SELECTOR_KEYS
      .filter((key) => key in params)
      .map((key) => [key, params[key]]),
  );
}

export function listEditableParamKeys(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  const defaults = createDefaultKeycapParams(profileKey);
  return Object.keys(defaults);
}

export function sanitizeEditorParamValue(fieldKey, value, fallback, paramsContext = {}) {
  if (fieldKey === "name") {
    return sanitizeExportBaseName(value, fallback);
  }

  if (fieldKey === "shapeProfile") {
    return isRecognizedShapeProfileKey(value) ? value : fallback;
  }

  if (fieldKey === "legendFontKey") {
    return resolveLegendFontConfig(value).key;
  }

  if (fieldKey === "legendFontStyleKey") {
    const legendFontKey = resolveLegendFontConfig(paramsContext?.legendFontKey).key;
    const styleOptions = getLegendFontStyleFieldOptions(legendFontKey);
    const allowedValues = new Set(styleOptions.map((option) => option.value));
    const fallbackValue = allowedValues.has(fallback) ? fallback : (styleOptions[0]?.value ?? LEGEND_FONT_STYLE_FALLBACK_KEY);
    return allowedValues.has(value) ? value : fallbackValue;
  }

  if (fieldKey === "stemType") {
    return isSupportedStemType(value) ? value : fallback;
  }

  if (fieldKey === "topSlopeInputMode") {
    return resolveTopSlopeInputMode(value, resolveTopSlopeInputMode(fallback));
  }

  if (fieldKey === "topSurfaceShape") {
    const profileKey = paramsContext?.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
    return resolveProfileTopSurfaceShape(
      profileKey,
      value,
      resolveProfileTopSurfaceShape(profileKey, fallback, "flat"),
    );
  }

  if (fieldKey === "legendOutlineDelta") {
    return clampLegendOutlineDelta(value, fallback);
  }

  if (fieldKey === "typewriterCornerRadius") {
    return clampTypewriterCornerRadius(value, fallback, paramsContext);
  }

  if (fieldKey === "rimWidth") {
    return clampTypewriterRimWidth(value, paramsContext, fallback);
  }

  if (fieldKey === "typewriterMountHeight") {
    return clampTypewriterMountHeight(value, paramsContext, fallback);
  }

  if (fieldKey === "jisEnterNotchWidth") {
    return clampJisEnterNotchWidth(value, paramsContext, fallback);
  }

  if (fieldKey === "jisEnterNotchDepth") {
    return clampJisEnterNotchDepth(value, paramsContext, fallback);
  }

  if (fieldKey === "rimHeightUp" || fieldKey === "rimHeightDown" || fieldKey === "homingBarChamfer") {
    return clampNonNegativeNumber(value, fallback);
  }

  if (fieldKey === "keyWidth" || fieldKey === "keyDepth") {
    return clampPositiveDimension(value, fallback);
  }

  if (COLOR_FIELD_KEYS.has(fieldKey)) {
    return normalizeHexColor(value) ?? fallback;
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

export function createExportableKeycapParams(params = {}) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const paramsContext = {
    ...defaults,
    ...params,
    shapeProfile: profileKey,
  };
  const sanitizedContext = { ...paramsContext };
  const exportableParams = {};

  for (const key of listEditableParamKeys(profileKey)) {
    exportableParams[key] = sanitizeEditorParamValue(key, sanitizedContext[key], defaults[key], sanitizedContext);
    sanitizedContext[key] = exportableParams[key];
  }

  return exportableParams;
}

export function createEditorDataPayloadFromParams(params, savedAt = new Date().toISOString()) {
  const sanitizedParams = createExportableKeycapParams(params);
  return {
    kind: EDITOR_DATA_KIND,
    schemaVersion: EDITOR_DATA_SCHEMA_VERSION,
    profileSchemaVersion: keycapEditorProfiles.schemaVersion ?? 1,
    savedAt,
    selectors: pickEditorSelectors(sanitizedParams),
    params: sanitizedParams,
  };
}

export function createEditorDataPayload(params) {
  return createEditorDataPayloadFromParams(params);
}

export function createShapeProfileDefaultPayload(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return createEditorDataPayloadFromParams(createDefaultKeycapParams(profileKey), null);
}

function isCurrentOrLegacyEditorDataKind(kind) {
  return kind === EDITOR_DATA_KIND || LEGACY_EDITOR_DATA_KINDS.has(kind);
}

function isCompatiblePatchKind(kind) {
  return kind === EDITOR_DATA_COMPAT_KIND;
}

function getCompatibleTopLevelParams(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !RESERVED_COMPAT_PAYLOAD_KEYS.has(key) && KNOWN_EDITOR_PARAM_KEY_SET.has(key)),
  );
}

function hasKnownKeys(object, allowedKeys) {
  return Object.keys(object).some((key) => allowedKeys.has(key));
}

function hasRecognizedCompatibleInput(payload) {
  const params = getPlainObject(payload.params) ?? {};
  const selectors = getPlainObject(payload.selectors) ?? {};
  const topLevelParams = getCompatibleTopLevelParams(payload);

  return hasKnownKeys(params, KNOWN_EDITOR_PARAM_KEY_SET)
    || hasKnownKeys(selectors, new Set(EDITOR_SELECTOR_KEYS))
    || hasKnownKeys(topLevelParams, KNOWN_EDITOR_PARAM_KEY_SET);
}

function parseFullEditorDataPayload(payload) {
  if (payload.schemaVersion !== EDITOR_DATA_SCHEMA_VERSION) {
    throw new Error(`未対応の編集データ schemaVersion です: ${payload.schemaVersion}`);
  }

  const params = getPlainObject(payload.params);
  if (!params) {
    throw new Error("編集データ JSON に params がありません。");
  }

  const selectors = getPlainObject(payload.selectors) ?? {};
  const rawProfileKey = selectors.shapeProfile ?? params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  if (!isRecognizedShapeProfileKey(rawProfileKey)) {
    throw new Error(`未対応の形のベースです: ${rawProfileKey}`);
  }

  const defaults = createDefaultKeycapParams(rawProfileKey);
  const legacyTopSurfaceShape = inferLegacyTopSurfaceShape(params);
  return {
    ...pickEditorSelectors(defaults),
    ...selectors,
    ...params,
    ...(legacyTopSurfaceShape == null ? {} : { topSurfaceShape: legacyTopSurfaceShape }),
    shapeProfile: rawProfileKey,
  };
}

function parseCompatibleEditorDataPayload(payload) {
  if (payload.kind != null && !isCompatiblePatchKind(payload.kind)) {
    throw new Error("KeycapMaker の編集データ JSON / 互換入力 JSON ではありません。");
  }

  if (isCompatiblePatchKind(payload.kind) && payload.schemaVersion != null && payload.schemaVersion !== EDITOR_DATA_COMPAT_SCHEMA_VERSION) {
    throw new Error(`未対応の互換入力 schemaVersion です: ${payload.schemaVersion}`);
  }

  if (!hasRecognizedCompatibleInput(payload)) {
    throw new Error("互換入力 JSON に編集パラメータがありません。");
  }

  const selectors = getPlainObject(payload.selectors) ?? {};
  const nestedParams = getPlainObject(payload.params) ?? {};
  const topLevelParams = getCompatibleTopLevelParams(payload);
  const mergedInputParams = {
    ...nestedParams,
    ...topLevelParams,
  };
  const rawProfileKey = selectors.shapeProfile ?? mergedInputParams.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  if (!isRecognizedShapeProfileKey(rawProfileKey)) {
    throw new Error(`未対応の形のベースです: ${rawProfileKey}`);
  }

  const defaults = createDefaultKeycapParams(rawProfileKey);
  const legacyTopSurfaceShape = inferLegacyTopSurfaceShape(mergedInputParams);
  return {
    ...pickEditorSelectors(defaults),
    ...selectors,
    ...mergedInputParams,
    ...(legacyTopSurfaceShape == null ? {} : { topSurfaceShape: legacyTopSurfaceShape }),
    shapeProfile: rawProfileKey,
  };
}

export function parseEditorDataPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("編集データ JSON の形式が不正です。");
  }

  if (payload.kind != null && !isCurrentOrLegacyEditorDataKind(payload.kind) && !isCompatiblePatchKind(payload.kind)) {
    throw new Error("KeycapMaker の編集データ JSON / 互換入力 JSON ではありません。");
  }

  const mergedRawParams = isCurrentOrLegacyEditorDataKind(payload.kind)
    ? parseFullEditorDataPayload(payload)
    : parseCompatibleEditorDataPayload(payload);
  const rawProfileKey = mergedRawParams.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(rawProfileKey);
  const paramsContext = {
    ...defaults,
    ...mergedRawParams,
    shapeProfile: rawProfileKey,
  };
  const sanitizedContext = { ...paramsContext };
  const nextParams = {};

  for (const key of listEditableParamKeys(rawProfileKey)) {
    nextParams[key] = sanitizeEditorParamValue(key, sanitizedContext[key], defaults[key], sanitizedContext);
    sanitizedContext[key] = nextParams[key];
  }

  return syncDerivedKeycapParams(nextParams);
}

export function createInitialKeycapParams(profileKey = DEFAULT_SHAPE_PROFILE_KEY) {
  return parseEditorDataPayload(createShapeProfileDefaultPayload(profileKey));
}
