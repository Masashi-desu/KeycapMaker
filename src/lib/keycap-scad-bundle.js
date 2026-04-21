import keycapBaseScad from "../../scad/base/keycap.scad?raw";
import shellModuleScad from "../../scad/modules/keycap_shell.scad?raw";
import homingBarScad from "../../scad/modules/homing_bar.scad?raw";
import legendBlockScad from "../../scad/modules/legend_block.scad?raw";
import stemMxScad from "../../scad/modules/stem_mx.scad?raw";
import stemChocV1Scad from "../../scad/modules/stem_choc_v1.scad?raw";
import stemChocV2Scad from "../../scad/modules/stem_choc_v2.scad?raw";
import stemAlpsScad from "../../scad/modules/stem_alps.scad?raw";
import standardPresetScad from "../../scad/presets/standard-1u.scad?raw";

export const KEYCAP_ENTRY_PATH = "/scad/base/keycap.scad";
export const KEYCAP_JOB_PATH = "/scad/base/keycap-job.scad";
export const DEFAULT_KEYCAP_LEGEND_FONT_KEY = "mplus1p";
const LEGEND_SIZE_WIDTH_RATIO = 1.8;
export const KEYCAP_LEGEND_FONTS = [
  {
    key: "mplus1p",
    label: "M PLUS 1p",
    fontName: "M PLUS 1p",
    assetPath: "fonts/MPLUS1p-Regular.ttf",
    runtimePath: "/fonts/MPLUS1p-Regular.ttf",
    licenseLabel: "SIL Open Font License 1.1",
  },
  {
    key: "mplusrounded1c",
    label: "M PLUS Rounded 1c",
    fontName: "M PLUS Rounded 1c",
    assetPath: "fonts/MPLUSRounded1c-Regular.ttf",
    runtimePath: "/fonts/MPLUSRounded1c-Regular.ttf",
    licenseLabel: "SIL Open Font License 1.1",
  },
  {
    key: "dotgothic16",
    label: "DotGothic16",
    fontName: "DotGothic16",
    assetPath: "fonts/DotGothic16-Regular.ttf",
    runtimePath: "/fonts/DotGothic16-Regular.ttf",
    licenseLabel: "SIL Open Font License 1.1",
  },
];
const KEYCAP_LEGEND_FONT_MAP = new Map(KEYCAP_LEGEND_FONTS.map((font) => [font.key, font]));

const SCAD_FILES = [
  { path: "/scad/base/keycap.scad", content: keycapBaseScad },
  { path: "/scad/modules/keycap_shell.scad", content: shellModuleScad },
  { path: "/scad/modules/homing_bar.scad", content: homingBarScad },
  { path: "/scad/modules/legend_block.scad", content: legendBlockScad },
  { path: "/scad/modules/stem_mx.scad", content: stemMxScad },
  { path: "/scad/modules/stem_choc_v1.scad", content: stemChocV1Scad },
  { path: "/scad/modules/stem_choc_v2.scad", content: stemChocV2Scad },
  { path: "/scad/modules/stem_alps.scad", content: stemAlpsScad },
  { path: "/scad/presets/standard-1u.scad", content: standardPresetScad },
];
const runtimeAssetPromises = new Map();

function clampLegendSize(value) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? Math.max(nextValue, 0.5) : 4.0;
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

function createKeycapDefinitions({ params, exportTarget }) {
  const selectedFont = resolveKeycapLegendFont(params.legendFontKey);
  const legendSize = clampLegendSize(params.legendSize);

  return {
    export_target: exportTarget,
    user_key_width: params.keyWidth,
    user_key_depth: params.keyDepth,
    user_top_center_height: params.topCenterHeight,
    user_wall_thickness: params.wallThickness,
    user_top_scale: params.topScale,
    user_dish_radius: params.dishRadius,
    user_dish_depth: params.dishDepth,
    user_top_pitch_deg: params.topPitchDeg,
    user_top_roll_deg: params.topRollDeg,
    user_legend_enabled: params.legendEnabled,
    user_legend_text: params.legendText,
    user_legend_font_name: selectedFont.fontName,
    user_legend_weight: params.legendWeight,
    user_legend_slant: params.legendSlant,
    user_legend_underline_enabled: params.legendUnderlineEnabled,
    user_legend_width: legendSize * LEGEND_SIZE_WIDTH_RATIO,
    user_legend_depth: legendSize,
    user_legend_height: params.legendHeight,
    user_legend_embed: params.legendEmbed,
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

export function resolveKeycapLegendFont(fontKey = DEFAULT_KEYCAP_LEGEND_FONT_KEY) {
  return KEYCAP_LEGEND_FONT_MAP.get(fontKey) ?? KEYCAP_LEGEND_FONT_MAP.get(DEFAULT_KEYCAP_LEGEND_FONT_KEY);
}

async function getRuntimeAssets(fontKey) {
  const selectedFont = resolveKeycapLegendFont(fontKey);
  const cachedPromise = runtimeAssetPromises.get(selectedFont.key);

  if (cachedPromise) {
    return cachedPromise;
  }

  const assetPromise = loadBinaryAsset(selectedFont.assetPath)
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
  const definitions = createKeycapDefinitions({ params, exportTarget });
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
