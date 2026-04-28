import {
  createDefaultKeycapParams,
  DEFAULT_SHAPE_PROFILE_KEY,
  getShapeProfileGeometryDefaults,
  resolveShapeGeometryType,
} from "../data/keycap-shape-registry.js";
import keycapBaseScad from "../../scad/base/keycap.scad?raw";
import shellModuleScad from "../../scad/modules/keycap_shell.scad?raw";
import jisEnterModuleScad from "../../scad/modules/keycap_jis_enter.scad?raw";
import typewriterModuleScad from "../../scad/modules/keycap_typewriter.scad?raw";
import homingBarScad from "../../scad/modules/homing_bar.scad?raw";
import legendBlockScad from "../../scad/modules/legend_block.scad?raw";
import sidewallLegendScad from "../../scad/modules/sidewall_legend.scad?raw";
import stemMxScad from "../../scad/modules/stem_mx.scad?raw";
import stemChocV1Scad from "../../scad/modules/stem_choc_v1.scad?raw";
import stemChocV2Scad from "../../scad/modules/stem_choc_v2.scad?raw";
import stemAlpsScad from "../../scad/modules/stem_alps.scad?raw";
import stemNominalsScad from "../../scad/presets/stem-nominals.scad?raw";
import {
  DEFAULT_KEYCAP_LEGEND_FONT_KEY,
  getKeycapLegendFontStyleOptions,
  KEYCAP_LEGEND_FONTS,
  resolveKeycapLegendFont,
} from "./keycap-fonts.js";

export const KEYCAP_ENTRY_PATH = "/scad/base/keycap.scad";
export const KEYCAP_JOB_PATH = "/scad/base/keycap-job.scad";
export { DEFAULT_KEYCAP_LEGEND_FONT_KEY, getKeycapLegendFontStyleOptions, KEYCAP_LEGEND_FONTS, resolveKeycapLegendFont };
const LEGEND_MIN_PLAN_WIDTH_RATIO = 1.8;
const LEGEND_PLAN_PADDING_RATIO = 0.15;
const LEGEND_PLAN_MIN_PADDING = 0.2;
const LEGEND_OVERFLOW_GUARD_WIDTH_RATIO = 2.5;
const LEGEND_OVERFLOW_GUARD_DEPTH_RATIO = 3.0;
const LEGEND_TEXT_MEASURE_SCALE = 100;
const LEGEND_FIELD_SUFFIXES = Object.freeze({
  enabled: "Enabled",
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
const SIDE_LEGEND_CONFIGS = Object.freeze([
  { side: "front", paramPrefix: "sideLegendFront", userPrefix: "side_legend_front", minimumWidthField: "keyWidth" },
  { side: "back", paramPrefix: "sideLegendBack", userPrefix: "side_legend_back", minimumWidthField: "keyWidth" },
  { side: "left", paramPrefix: "sideLegendLeft", userPrefix: "side_legend_left", minimumWidthField: "keyDepth" },
  { side: "right", paramPrefix: "sideLegendRight", userPrefix: "side_legend_right", minimumWidthField: "keyDepth" },
]);
const TYPEWRITER_MIN_STEM_HEIGHT = 0.6;
const TYPEWRITER_STEM_MOUNT_OVERLAP = 0.02;
const LEGEND_FONT_MEASURE_CANVAS = typeof document === "undefined" ? null : document.createElement("canvas");
const fontBinaryPromises = new Map();
const fontMetadataPromises = new Map();

const SCAD_FILES = [
  { path: "/scad/base/keycap.scad", content: keycapBaseScad },
  { path: "/scad/modules/keycap_shell.scad", content: shellModuleScad },
  { path: "/scad/modules/keycap_jis_enter.scad", content: jisEnterModuleScad },
  { path: "/scad/modules/keycap_typewriter.scad", content: typewriterModuleScad },
  { path: "/scad/modules/homing_bar.scad", content: homingBarScad },
  { path: "/scad/modules/legend_block.scad", content: legendBlockScad },
  { path: "/scad/modules/sidewall_legend.scad", content: sidewallLegendScad },
  { path: "/scad/modules/stem_mx.scad", content: stemMxScad },
  { path: "/scad/modules/stem_choc_v1.scad", content: stemChocV1Scad },
  { path: "/scad/modules/stem_choc_v2.scad", content: stemChocV2Scad },
  { path: "/scad/modules/stem_alps.scad", content: stemAlpsScad },
  { path: "/scad/presets/stem-nominals.scad", content: stemNominalsScad },
];
const runtimeAssetPromises = new Map();
const measurementFontPromises = new Map();

function clampTypewriterCornerRadius(value, fallback = 0) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) {
    return Math.max(Number(fallback) || 0, 0);
  }

  return Math.max(nextValue, 0);
}

function clampMinimum(value, fallback, minimum) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, minimum) : fallback;
}

function numberOr(value, fallback) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function legendParamKey(prefix, suffix) {
  return `${prefix}${suffix}`;
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

function isTypewriterGeometryType(geometryType) {
  return geometryType === "typewriter" || geometryType === "typewriter_jis_enter";
}

function isTopHatGeometryType(geometryType) {
  return geometryType === "shell" || geometryType === "jis_enter";
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

function resolveShapeGeometryParameters(params = {}) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const geometryDefaults = getShapeProfileGeometryDefaults(profileKey);
  const geometryType = resolveShapeGeometryType(profileKey);
  const keyWidth = clampMinimum(params.keyWidth, defaults.keyWidth ?? 18, 1);
  const keyDepth = clampMinimum(params.keyDepth, defaults.keyDepth ?? 18, 1);
  const topCenterHeight = clampMinimum(params.topCenterHeight, defaults.topCenterHeight ?? 9.5, 0.1);
  const topScale = clampTopScale(params.topScale, defaults.topScale ?? 1);
  const horizontalAngle = resolveTopScaleAngle(keyWidth, topCenterHeight, topScale);
  const verticalAngle = resolveTopScaleAngle(keyDepth, topCenterHeight, topScale);

  return {
    shapeGeometryType: geometryType,
    profileFrontAngle: isTypewriterGeometryType(geometryType) ? 0 : verticalAngle,
    profileBackAngle: isTypewriterGeometryType(geometryType) ? 0 : verticalAngle,
    profileLeftAngle: isTypewriterGeometryType(geometryType) ? 0 : horizontalAngle,
    profileRightAngle: isTypewriterGeometryType(geometryType) ? 0 : horizontalAngle,
    topThickness: Math.max(Number(geometryDefaults.topThickness ?? 0.05), 0.05),
    bottomCornerRadius: Math.max(Number(geometryDefaults.bottomCornerRadius ?? 0), 0),
    topCornerRadius: Math.max(Number(geometryDefaults.topCornerRadius ?? 0), 0),
  };
}

function hasByteRange(start, length, totalLength) {
  return Number.isInteger(start)
    && Number.isInteger(length)
    && start >= 0
    && length >= 0
    && start + length <= totalLength;
}

function readSfntTag(fontBytes, offset) {
  return String.fromCharCode(...fontBytes.subarray(offset, offset + 4));
}

function readSfntTableDirectory(fontBytes) {
  if (!hasByteRange(0, 12, fontBytes.byteLength)) {
    return null;
  }

  const view = new DataView(fontBytes.buffer, fontBytes.byteOffset, fontBytes.byteLength);
  const numTables = view.getUint16(4);
  const directoryLength = 12 + (numTables * 16);
  if (!hasByteRange(0, directoryLength, fontBytes.byteLength)) {
    return null;
  }

  const tables = new Map();
  for (let index = 0; index < numTables; index += 1) {
    const entryOffset = 12 + (index * 16);
    const tag = readSfntTag(fontBytes, entryOffset);
    const offset = view.getUint32(entryOffset + 8);
    const length = view.getUint32(entryOffset + 12);
    tables.set(tag, { offset, length });
  }

  return tables;
}

function parseLegendFontMetadata(fontBytes) {
  const tables = readSfntTableDirectory(fontBytes);
  if (!tables) {
    return null;
  }

  const headTable = tables.get("head");
  const hheaTable = tables.get("hhea");
  const postTable = tables.get("post");
  if (!headTable || !hheaTable || !postTable) {
    return null;
  }

  const headUnitsOffset = headTable.offset + 18;
  const hheaAscentOffset = hheaTable.offset + 4;
  const hheaDescentOffset = hheaTable.offset + 6;
  const postUnderlinePositionOffset = postTable.offset + 8;
  const postUnderlineThicknessOffset = postTable.offset + 10;
  if (
    !hasByteRange(headUnitsOffset, 2, fontBytes.byteLength)
    || !hasByteRange(hheaAscentOffset, 2, fontBytes.byteLength)
    || !hasByteRange(hheaDescentOffset, 2, fontBytes.byteLength)
    || !hasByteRange(postUnderlinePositionOffset, 2, fontBytes.byteLength)
    || !hasByteRange(postUnderlineThicknessOffset, 2, fontBytes.byteLength)
  ) {
    return null;
  }

  const view = new DataView(fontBytes.buffer, fontBytes.byteOffset, fontBytes.byteLength);
  const unitsPerEm = view.getUint16(headUnitsOffset);
  if (!Number.isFinite(unitsPerEm) || unitsPerEm <= 0) {
    return null;
  }

  const ascent = view.getInt16(hheaAscentOffset);
  const descent = view.getInt16(hheaDescentOffset);
  const underlinePosition = view.getInt16(postUnderlinePositionOffset);
  const underlineThickness = view.getInt16(postUnderlineThicknessOffset);

  return {
    unitsPerEm,
    underlinePositionEm: underlinePosition / unitsPerEm,
    underlineThicknessEm: Math.max(underlineThickness / unitsPerEm, 0),
    lineBoxCenterEm: (ascent + descent) / (2 * unitsPerEm),
  };
}

function clampLegendSize(value) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, 0.5) : 4.0;
}

function resolveKeycapLegendFontStyle(font, styleKey) {
  const nativeStyleOptions = font?.nativeStyleOptions ?? [];
  if (nativeStyleOptions.length === 0) {
    return null;
  }

  return nativeStyleOptions.find((option) => option.key === styleKey)
    ?? nativeStyleOptions.find((option) => option.key === font.defaultStyleKey)
    ?? nativeStyleOptions[0];
}

function legendTextSize(depth) {
  return Math.max(Number(depth), 0);
}

function estimateLegendTextWidth(label, size) {
  return Array.from(String(label ?? "")).length * size;
}

function positiveTextMetric(value) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, 0) : 0;
}

function resolveLegendMeasurementWeight(selectedFont, selectedFontStyle) {
  return selectedFontStyle?.cssWeight ?? selectedFont.cssWeight ?? 400;
}

async function ensureMeasurementFontLoaded(selectedFont) {
  if (!selectedFont?.measurementFamily || typeof FontFace === "undefined" || typeof document === "undefined") {
    return null;
  }

  const cachedPromise = measurementFontPromises.get(selectedFont.key);
  if (cachedPromise) {
    return cachedPromise;
  }

  const descriptors = selectedFont.fontKind === "variable"
    ? { style: "normal", weight: "100 900" }
    : { style: "normal", weight: `${selectedFont.cssWeight ?? 400}` };
  const fontFacePromise = new FontFace(
    selectedFont.measurementFamily,
    `url(${resolvePublicAssetUrl(selectedFont.assetPath)})`,
    descriptors,
  )
    .load()
    .then((loadedFace) => {
      document.fonts.add(loadedFace);
      return loadedFace;
    })
    .catch((error) => {
      measurementFontPromises.delete(selectedFont.key);
      throw error;
    });

  measurementFontPromises.set(selectedFont.key, fontFacePromise);
  return fontFacePromise;
}

async function getFontBinaryAsset(selectedFont) {
  const cachedPromise = fontBinaryPromises.get(selectedFont.key);
  if (cachedPromise) {
    return cachedPromise;
  }

  const binaryPromise = loadBinaryAsset(selectedFont.assetPath)
    .catch((error) => {
      fontBinaryPromises.delete(selectedFont.key);
      throw error;
    });

  fontBinaryPromises.set(selectedFont.key, binaryPromise);
  return binaryPromise;
}

async function getLegendFontMetadata(selectedFont) {
  const cachedPromise = fontMetadataPromises.get(selectedFont.key);
  if (cachedPromise) {
    return cachedPromise;
  }

  const metadataPromise = getFontBinaryAsset(selectedFont)
    .then((fontBytes) => parseLegendFontMetadata(fontBytes))
    .catch((error) => {
      fontMetadataPromises.delete(selectedFont.key);
      throw error;
    });

  fontMetadataPromises.set(selectedFont.key, metadataPromise);
  return metadataPromise;
}

async function measureLegendTextWidth({ label, size, selectedFont, selectedFontStyle }) {
  const bounds = await measureLegendTextBounds({
    label,
    size,
    selectedFont,
    selectedFontStyle,
  });

  return bounds.width;
}

async function measureLegendTextBounds({ label, size, selectedFont, selectedFontStyle }) {
  if (!label) {
    return {
      width: 0,
      depth: size,
    };
  }

  if (!LEGEND_FONT_MEASURE_CANVAS) {
    return {
      width: estimateLegendTextWidth(label, size),
      depth: size,
    };
  }

  let loadedMeasurementFont = null;
  try {
    loadedMeasurementFont = await ensureMeasurementFontLoaded(selectedFont);
  } catch {
    return {
      width: estimateLegendTextWidth(label, size),
      depth: size,
    };
  }
  if (!loadedMeasurementFont) {
    return {
      width: estimateLegendTextWidth(label, size),
      depth: size,
    };
  }

  const context = LEGEND_FONT_MEASURE_CANVAS.getContext("2d");
  if (!context) {
    return {
      width: estimateLegendTextWidth(label, size),
      depth: size,
    };
  }

  const measurementWeight = resolveLegendMeasurementWeight(selectedFont, selectedFontStyle);
  context.font = `${measurementWeight} ${LEGEND_TEXT_MEASURE_SCALE}px "${selectedFont.measurementFamily}"`;
  const metrics = context.measureText(label);
  const metricScale = size / LEGEND_TEXT_MEASURE_SCALE;
  const advanceWidth = metrics.width * metricScale;
  const actualWidth = (
    positiveTextMetric(metrics.actualBoundingBoxLeft)
    + positiveTextMetric(metrics.actualBoundingBoxRight)
  ) * metricScale;
  const actualDepth = (
    positiveTextMetric(metrics.actualBoundingBoxAscent)
    + positiveTextMetric(metrics.actualBoundingBoxDescent)
  ) * metricScale;
  const fontDepth = (
    positiveTextMetric(metrics.fontBoundingBoxAscent)
    + positiveTextMetric(metrics.fontBoundingBoxDescent)
  ) * metricScale;
  const measuredWidth = Math.max(advanceWidth, actualWidth, 0);

  return {
    width: measuredWidth > 0 ? measuredWidth : estimateLegendTextWidth(label, size),
    depth: Math.max(actualDepth, fontDepth, size, 0),
  };
}

async function resolveLegendUnderlineSpan({
  label,
  size,
  selectedFont,
  selectedFontStyle,
}) {
  const measuredTextWidth = await measureLegendTextWidth({
    label,
    size,
    selectedFont,
    selectedFontStyle,
  });

  return measuredTextWidth;
}

async function resolveLegendUnderlineGeometry({
  enabled,
  label,
  size,
  selectedFont,
  selectedFontStyle,
}) {
  if (!enabled) {
    return {
      enabled: false,
      span: 0,
      thickness: 0,
      centerOffset: 0,
    };
  }

  let fontMetadata = null;
  try {
    fontMetadata = await getLegendFontMetadata(selectedFont);
  } catch {
    return {
      enabled: false,
      span: 0,
      thickness: 0,
      centerOffset: 0,
    };
  }

  if (!fontMetadata || fontMetadata.underlineThicknessEm <= 0) {
    return {
      enabled: false,
      span: 0,
      thickness: 0,
      centerOffset: 0,
    };
  }

  const span = await resolveLegendUnderlineSpan({
    label,
    size,
    selectedFont,
    selectedFontStyle,
  });
  const thickness = fontMetadata.underlineThicknessEm * size;
  const centerOffset = (
    fontMetadata.underlinePositionEm
    - (fontMetadata.underlineThicknessEm / 2)
    - fontMetadata.lineBoxCenterEm
  ) * size;

  if (!(span > 0) || !(thickness > 0)) {
    return {
      enabled: false,
      span: 0,
      thickness: 0,
      centerOffset: 0,
    };
  }

  return {
    enabled: true,
    span,
    thickness,
    centerOffset,
  };
}

function resolveLegendPlanPadding(size, outlineDelta) {
  return Math.max(size * LEGEND_PLAN_PADDING_RATIO, Math.abs(Number(outlineDelta) || 0), LEGEND_PLAN_MIN_PADDING);
}

function resolveLegendUnderlineDepth(underlineGeometry) {
  return underlineGeometry.enabled
    ? Math.abs(underlineGeometry.centerOffset) * 2 + underlineGeometry.thickness
    : 0;
}

function resolveLegendOverflowGuardSize({ label, size, outlineDelta, underlineGeometry }) {
  const padding = resolveLegendPlanPadding(size, outlineDelta);
  const characterCount = Math.max(Array.from(String(label ?? "")).length, 1);

  return {
    width: (characterCount * size * LEGEND_OVERFLOW_GUARD_WIDTH_RATIO) + padding * 2,
    depth: Math.max(size * LEGEND_OVERFLOW_GUARD_DEPTH_RATIO, resolveLegendUnderlineDepth(underlineGeometry)) + padding * 2,
  };
}

function resolveLegendPlanSize({ size, outlineDelta, textBounds, underlineGeometry, minimumWidth = 0, minimumDepth = 0 }) {
  const padding = resolveLegendPlanPadding(size, outlineDelta);
  const underlineDepth = resolveLegendUnderlineDepth(underlineGeometry);

  return {
    width: Math.max(
      positiveTextMetric(minimumWidth),
      size * LEGEND_MIN_PLAN_WIDTH_RATIO,
      Math.max(Number(textBounds.width) || 0, underlineGeometry.span || 0, 0) + padding * 2,
    ),
    depth: Math.max(
      positiveTextMetric(minimumDepth),
      size,
      Math.max(Number(textBounds.depth) || 0, underlineDepth, 0) + padding * 2,
    ),
  };
}

async function resolveLegendBridgeDefinitions({
  params,
  paramPrefix,
  userPrefix,
  minimumWidth,
  minimumDepth,
  includeEmbed = true,
}) {
  const enabledKey = legendParamKey(paramPrefix, LEGEND_FIELD_SUFFIXES.enabled);
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
  const selectedFont = resolveKeycapLegendFont(params[fontKey]);
  const selectedFontStyle = resolveKeycapLegendFontStyle(selectedFont, params[fontStyleKey]);
  const legendSize = clampLegendSize(params[sizeKey]);
  const resolvedTextSize = legendTextSize(legendSize);
  const label = params[textKey] ?? "";
  const outlineDelta = params[outlineDeltaKey] ?? 0;
  const textBounds = await measureLegendTextBounds({
    label,
    size: resolvedTextSize,
    selectedFont,
    selectedFontStyle,
  });
  const underlineGeometry = await resolveLegendUnderlineGeometry({
    enabled: params[underlineEnabledKey],
    label,
    size: resolvedTextSize,
    selectedFont,
    selectedFontStyle,
  });
  const overflowGuard = resolveLegendOverflowGuardSize({
    label,
    size: resolvedTextSize,
    outlineDelta,
    underlineGeometry,
  });
  const planSize = resolveLegendPlanSize({
    size: resolvedTextSize,
    outlineDelta,
    textBounds,
    underlineGeometry,
    minimumWidth: Math.max(positiveTextMetric(minimumWidth), overflowGuard.width),
    minimumDepth: Math.max(positiveTextMetric(minimumDepth), overflowGuard.depth),
  });

  return {
    [`user_${userPrefix}_enabled`]: Boolean(params[enabledKey]),
    [`user_${userPrefix}_text`]: label,
    [`user_${userPrefix}_font_name`]: selectedFontStyle?.fontQuery ?? selectedFont.fontQuery ?? selectedFont.fontName,
    [`user_${userPrefix}_underline_enabled`]: underlineGeometry.enabled,
    [`user_${userPrefix}_underline_width`]: underlineGeometry.span,
    [`user_${userPrefix}_underline_thickness`]: underlineGeometry.thickness,
    [`user_${userPrefix}_underline_offset_y`]: underlineGeometry.centerOffset,
    [`user_${userPrefix}_width`]: planSize.width,
    [`user_${userPrefix}_depth`]: planSize.depth,
    [`user_${userPrefix}_text_size`]: resolvedTextSize,
    [`user_${userPrefix}_height`]: params[heightKey],
    ...(includeEmbed ? { [`user_${userPrefix}_embed`]: params[embedKey] } : {}),
    [`user_${userPrefix}_outline_delta`]: outlineDelta,
    [`user_${userPrefix}_offset_x`]: params[offsetXKey],
    [`user_${userPrefix}_offset_y`]: params[offsetYKey],
  };
}

function formatDefinitionValue(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return `${value}`;
}

async function createKeycapDefinitions({ params, exportTarget }) {
  const shapeGeometry = resolveShapeGeometryParameters(params);
  const topSurfaceShape = params.topSurfaceShape ?? (Math.abs(Number(params.dishDepth ?? 0)) > 0.001 ? "spherical" : "flat");
  const topLegendDefinitions = await resolveLegendBridgeDefinitions({
    params,
    paramPrefix: "legend",
    userPrefix: "legend",
    // Keep this as an overlarge surface-fitting region, not a key footprint cap.
    // Oversized legends are allowed to overhang instead of being clipped.
    minimumWidth: positiveTextMetric(params.keyWidth),
    minimumDepth: positiveTextMetric(params.keyDepth),
  });
  const sideLegendDefinitionList = await Promise.all(SIDE_LEGEND_CONFIGS.map((config) => (
    resolveLegendBridgeDefinitions({
      params,
      paramPrefix: config.paramPrefix,
      userPrefix: config.userPrefix,
      minimumWidth: positiveTextMetric(params[config.minimumWidthField]),
      minimumDepth: positiveTextMetric(params.topCenterHeight),
      includeEmbed: false,
    })
  )));
  const sideLegendDefinitions = Object.assign({}, ...sideLegendDefinitionList);

  return {
    export_target: exportTarget,
    user_shape_geometry_type: shapeGeometry.shapeGeometryType,
    user_key_width: params.keyWidth,
    user_key_depth: params.keyDepth,
    user_jis_enter_notch_width: Math.max(Number(params.jisEnterNotchWidth ?? 0), 0),
    user_jis_enter_notch_depth: Math.max(Number(params.jisEnterNotchDepth ?? 0), 0),
    user_top_center_height: params.topCenterHeight,
    user_wall_thickness: params.wallThickness,
    user_typewriter_mount_height: clampTypewriterMountHeight(
      params.typewriterMountHeight,
      params,
      createDefaultKeycapParams(params.shapeProfile ?? "typewriter").typewriterMountHeight
        ?? createDefaultKeycapParams("typewriter").typewriterMountHeight,
    ),
    user_typewriter_corner_radius: clampTypewriterCornerRadius(
      params.typewriterCornerRadius,
      Math.min(Number(params.keyWidth ?? 18), Number(params.keyDepth ?? 18)) / 2,
    ),
    user_profile_front_angle: shapeGeometry.profileFrontAngle,
    user_profile_back_angle: shapeGeometry.profileBackAngle,
    user_profile_left_angle: shapeGeometry.profileLeftAngle,
    user_profile_right_angle: shapeGeometry.profileRightAngle,
    user_top_thickness: shapeGeometry.topThickness,
    user_bottom_corner_radius: shapeGeometry.bottomCornerRadius,
    user_top_corner_radius: shapeGeometry.topCornerRadius,
    user_top_shape_type: topSurfaceShape,
    user_dish_radius: params.dishRadius,
    user_dish_depth: params.dishDepth,
    user_top_pitch_deg: params.topPitchDeg,
    user_top_roll_deg: params.topRollDeg,
    user_top_offset_x: numberOr(params.topOffsetX, 0),
    user_top_offset_y: numberOr(params.topOffsetY, 0),
    user_top_hat_enabled: isTopHatGeometryType(shapeGeometry.shapeGeometryType) && Boolean(params.topHatEnabled),
    user_top_hat_top_width: Math.max(numberOr(params.topHatTopWidth, 10.5), 0.2),
    user_top_hat_top_depth: Math.max(numberOr(params.topHatTopDepth, 9.5), 0.2),
    user_top_hat_inset: Math.max(numberOr(params.topHatInset, 2.0), 0),
    user_top_hat_top_radius: Math.max(numberOr(params.topHatTopRadius, 1.8), 0),
    user_top_hat_height: numberOr(params.topHatHeight, 1.4),
    user_top_hat_shoulder_angle: Math.min(Math.max(numberOr(params.topHatShoulderAngle, 45), 5), 85),
    user_top_hat_shoulder_radius: numberOr(params.topHatShoulderRadius, 0),
    user_rim_enabled: Boolean(params.rimEnabled),
    user_rim_width: Math.max(Number(params.rimWidth ?? 0), 0),
    user_rim_height_up: Math.max(Number(params.rimHeightUp ?? 0), 0),
    user_rim_height_down: Math.max(Number(params.rimHeightDown ?? 0), 0),
    ...topLegendDefinitions,
    ...sideLegendDefinitions,
    user_homing_bar_enabled: params.homingBarEnabled,
    user_homing_bar_length: params.homingBarLength,
    user_homing_bar_width: params.homingBarWidth,
    user_homing_bar_height: params.homingBarHeight,
    user_homing_bar_offset_y: params.homingBarOffsetY,
    user_homing_bar_chamfer: Math.max(Number(params.homingBarChamfer ?? 0), 0),
    user_stem_type: params.stemType,
    user_stem_enabled: params.stemEnabled,
    user_stem_outer_delta: params.stemOuterDelta,
    user_stem_cross_margin: params.stemCrossMargin,
    user_stem_inset_delta: params.stemInsetDelta,
  };
}

function buildKeycapJobScad(definitions) {
  const prelude = Object.entries(definitions)
    .map(([key, value]) => `${key} = ${formatDefinitionValue(value)};`)
    .join("\n");

  return `// Browser-side OpenSCAD runtime ignores -D overrides, so generate a wrapper entrypoint.\n${prelude}\ninclude <keycap.scad>\n`;
}

function resolvePublicAssetUrl(relativePath) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(relativePath, baseUrl).toString();
}

async function loadBinaryAsset(relativePath) {
  const response = await fetch(resolvePublicAssetUrl(relativePath));
  if (!response.ok) {
    throw new Error(`runtime asset の読み込みに失敗しました: ${relativePath}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function getRuntimeAssetsForFont(fontKey) {
  const selectedFont = resolveKeycapLegendFont(fontKey);
  const cachedPromise = runtimeAssetPromises.get(selectedFont.key);

  if (cachedPromise) {
    return cachedPromise;
  }

  const assetPromise = getFontBinaryAsset(selectedFont)
    .then((fontBytes) => [
      {
        path: selectedFont.runtimePath,
        content: fontBytes,
      },
    ])
    .catch((error) => {
      runtimeAssetPromises.delete(selectedFont.key);
      throw error;
    });

  runtimeAssetPromises.set(selectedFont.key, assetPromise);
  return assetPromise;
}

function getLegendFontKeys(params = {}) {
  return [
    params.legendFontKey,
    ...SIDE_LEGEND_CONFIGS.map((config) => params[legendParamKey(config.paramPrefix, LEGEND_FIELD_SUFFIXES.fontKey)]),
  ].filter(Boolean);
}

async function getRuntimeAssets(params = {}) {
  const fontKeys = Array.from(new Set(getLegendFontKeys(params)));
  const assetLists = await Promise.all(fontKeys.map((fontKey) => getRuntimeAssetsForFont(fontKey)));
  return assetLists.flat();
}

export async function createKeycapFiles({ params, exportTarget }) {
  const definitions = await createKeycapDefinitions({ params, exportTarget });
  const runtimeAssets = await getRuntimeAssets(params);

  return [
    ...SCAD_FILES.map((file) => ({ ...file })),
    ...runtimeAssets.map((file) => ({ ...file })),
    {
      path: KEYCAP_JOB_PATH,
      content: buildKeycapJobScad(definitions),
    },
  ];
}

export function buildKeycapArgs({ outputPath, outputFormat }) {
  return [
    "-o",
    outputPath,
    "--backend=manifold",
    `--export-format=${outputFormat === "stl" ? "binstl" : outputFormat}`,
    KEYCAP_JOB_PATH,
  ];
}
