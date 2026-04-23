import {
  createDefaultKeycapParams,
  DEFAULT_SHAPE_PROFILE_KEY,
  getShapeProfileGeometryDefaults,
  resolveShapeGeometryType,
} from "../data/keycap-shape-registry.js";
import keycapBaseScad from "../../scad/base/keycap.scad?raw";
import shellModuleScad from "../../scad/modules/keycap_shell.scad?raw";
import typewriterModuleScad from "../../scad/modules/keycap_typewriter.scad?raw";
import homingBarScad from "../../scad/modules/homing_bar.scad?raw";
import legendBlockScad from "../../scad/modules/legend_block.scad?raw";
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
const LEGEND_SIZE_WIDTH_RATIO = 1.8;
const LEGEND_TEXT_MEASURE_SCALE = 100;
const LEGEND_FONT_MEASURE_CANVAS = typeof document === "undefined" ? null : document.createElement("canvas");
const fontBinaryPromises = new Map();
const fontMetadataPromises = new Map();

const SCAD_FILES = [
  { path: "/scad/base/keycap.scad", content: keycapBaseScad },
  { path: "/scad/modules/keycap_shell.scad", content: shellModuleScad },
  { path: "/scad/modules/keycap_typewriter.scad", content: typewriterModuleScad },
  { path: "/scad/modules/homing_bar.scad", content: homingBarScad },
  { path: "/scad/modules/legend_block.scad", content: legendBlockScad },
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

function resolveShapeGeometryParameters(params = {}) {
  const profileKey = params.shapeProfile ?? DEFAULT_SHAPE_PROFILE_KEY;
  const defaults = createDefaultKeycapParams(profileKey);
  const geometryDefaults = getShapeProfileGeometryDefaults(profileKey);
  const geometryType = resolveShapeGeometryType(profileKey);
  const topScale = Number(params.topScale ?? defaults.topScale ?? 1);
  const defaultTopScale = Number(defaults.topScale ?? 1);
  const taperFactor = defaultTopScale >= 1
    ? 1
    : Math.max((1 - topScale) / Math.max(1 - defaultTopScale, 0.01), 0);

  return {
    shapeGeometryType: geometryType,
    profileFrontAngle: geometryType === "typewriter" ? 0 : Math.max(Number(geometryDefaults.profileFrontAngle ?? 0) * taperFactor, 0.1),
    profileBackAngle: geometryType === "typewriter" ? 0 : Math.max(Number(geometryDefaults.profileBackAngle ?? 0) * taperFactor, 0.1),
    profileLeftAngle: geometryType === "typewriter" ? 0 : Math.max(Number(geometryDefaults.profileLeftAngle ?? 0) * taperFactor, 0.1),
    profileRightAngle: geometryType === "typewriter" ? 0 : Math.max(Number(geometryDefaults.profileRightAngle ?? 0) * taperFactor, 0.1),
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
  if (!label) {
    return 0;
  }

  if (!LEGEND_FONT_MEASURE_CANVAS) {
    return 0;
  }

  let loadedMeasurementFont = null;
  try {
    loadedMeasurementFont = await ensureMeasurementFontLoaded(selectedFont);
  } catch {
    return 0;
  }
  if (!loadedMeasurementFont) {
    return 0;
  }

  const context = LEGEND_FONT_MEASURE_CANVAS.getContext("2d");
  if (!context) {
    return 0;
  }

  const measurementWeight = resolveLegendMeasurementWeight(selectedFont, selectedFontStyle);
  context.font = `${measurementWeight} ${LEGEND_TEXT_MEASURE_SCALE}px "${selectedFont.measurementFamily}"`;
  return (context.measureText(label).width / LEGEND_TEXT_MEASURE_SCALE) * size;
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
  const selectedFont = resolveKeycapLegendFont(params.legendFontKey);
  const shapeGeometry = resolveShapeGeometryParameters(params);
  const legendSize = clampLegendSize(params.legendSize);
  const selectedFontStyle = resolveKeycapLegendFontStyle(selectedFont, params.legendFontStyleKey);
  const topSurfaceShape = params.topSurfaceShape ?? (Math.abs(Number(params.dishDepth ?? 0)) > 0.001 ? "spherical" : "flat");
  const legendWidth = legendSize * LEGEND_SIZE_WIDTH_RATIO;
  const legendDepth = legendSize;
  const resolvedLegendTextSize = legendTextSize(legendDepth);
  const underlineGeometry = await resolveLegendUnderlineGeometry({
    enabled: params.legendUnderlineEnabled,
    label: params.legendText,
    size: resolvedLegendTextSize,
    selectedFont,
    selectedFontStyle,
  });

  return {
    export_target: exportTarget,
    user_shape_geometry_type: shapeGeometry.shapeGeometryType,
    user_key_width: params.keyWidth,
    user_key_depth: params.keyDepth,
    user_top_center_height: params.topCenterHeight,
    user_wall_thickness: params.wallThickness,
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
    user_rim_enabled: Boolean(params.rimEnabled),
    user_rim_width: Math.max(Number(params.rimWidth ?? 0), 0),
    user_rim_height_up: Math.max(Number(params.rimHeightUp ?? 0), 0),
    user_rim_height_down: Math.max(Number(params.rimHeightDown ?? 0), 0),
    user_legend_enabled: params.legendEnabled,
    user_legend_text: params.legendText,
    user_legend_font_name: selectedFontStyle?.fontQuery ?? selectedFont.fontQuery ?? selectedFont.fontName,
    user_legend_underline_enabled: underlineGeometry.enabled,
    user_legend_underline_width: underlineGeometry.span,
    user_legend_underline_thickness: underlineGeometry.thickness,
    user_legend_underline_offset_y: underlineGeometry.centerOffset,
    user_legend_width: legendWidth,
    user_legend_depth: legendDepth,
    user_legend_height: params.legendHeight,
    user_legend_embed: params.legendEmbed,
    user_legend_outline_delta: params.legendOutlineDelta,
    user_legend_offset_x: params.legendOffsetX,
    user_legend_offset_y: params.legendOffsetY,
    user_homing_bar_enabled: params.homingBarEnabled,
    user_homing_bar_length: params.homingBarLength,
    user_homing_bar_width: params.homingBarWidth,
    user_homing_bar_height: params.homingBarHeight,
    user_homing_bar_offset_y: params.homingBarOffsetY,
    user_homing_bar_base_thickness: params.homingBarBaseThickness,
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

async function getRuntimeAssets(fontKey) {
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

export async function createKeycapFiles({ params, exportTarget }) {
  const definitions = await createKeycapDefinitions({ params, exportTarget });
  const runtimeAssets = await getRuntimeAssets(params.legendFontKey);

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
