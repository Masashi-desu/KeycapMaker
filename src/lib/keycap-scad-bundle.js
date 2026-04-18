import keycapBaseScad from "../../scad/base/keycap.scad?raw";
import keycapShellScad from "../../scad/modules/keycap_shell.scad?raw";
import homingBarScad from "../../scad/modules/homing_bar.scad?raw";
import legendBlockScad from "../../scad/modules/legend_block.scad?raw";
import stemChocV2Scad from "../../scad/modules/stem_choc_v2.scad?raw";
import standardPresetScad from "../../scad/presets/standard-1u.scad?raw";

export const KEYCAP_ENTRY_PATH = "/scad/base/keycap.scad";
export const KEYCAP_JOB_PATH = "/scad/base/keycap-job.scad";

const SCAD_FILES = [
  { path: "/scad/base/keycap.scad", content: keycapBaseScad },
  { path: "/scad/modules/keycap_shell.scad", content: keycapShellScad },
  { path: "/scad/modules/homing_bar.scad", content: homingBarScad },
  { path: "/scad/modules/legend_block.scad", content: legendBlockScad },
  { path: "/scad/modules/stem_choc_v2.scad", content: stemChocV2Scad },
  { path: "/scad/presets/standard-1u.scad", content: standardPresetScad },
];

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
  return {
    export_target: exportTarget,
    user_key_width: params.keyWidth,
    user_key_depth: params.keyDepth,
    user_body_height: params.bodyHeight,
    user_wall_thickness: params.wallThickness,
    user_top_scale: params.topScale,
    user_legend_enabled: params.legendEnabled,
    user_legend_width: params.legendWidth,
    user_legend_depth: params.legendDepth,
    user_legend_height: params.legendHeight,
    user_legend_offset_x: params.legendOffsetX,
    user_legend_offset_y: params.legendOffsetY,
    user_homing_bar_enabled: params.homingBarEnabled,
    user_homing_bar_length: params.homingBarLength,
    user_homing_bar_width: params.homingBarWidth,
    user_homing_bar_height: params.homingBarHeight,
    user_homing_bar_offset_y: params.homingBarOffsetY,
    user_homing_bar_base_thickness: params.homingBarBaseThickness,
    user_stem_enabled: params.stemEnabled,
    user_stem_width: params.stemWidth,
    user_stem_depth: params.stemDepth,
    user_stem_height: params.stemHeight,
    user_stem_inset: params.stemInset,
  };
}

function buildKeycapJobScad(definitions) {
  const prelude = Object.entries(definitions)
    .map(([key, value]) => `${key} = ${formatDefinitionValue(value)};`)
    .join("\n");

  return `// Browser-side OpenSCAD runtime ignores -D overrides, so generate a wrapper entrypoint.\n${prelude}\ninclude <keycap.scad>\n`;
}

export function createKeycapFiles({ params, exportTarget }) {
  const definitions = createKeycapDefinitions({ params, exportTarget });

  return [
    ...SCAD_FILES.map((file) => ({ ...file })),
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
