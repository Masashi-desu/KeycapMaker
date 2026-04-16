import keycapBaseScad from "../../scad/base/keycap.scad?raw";
import keycapShellScad from "../../scad/modules/keycap_shell.scad?raw";
import legendBlockScad from "../../scad/modules/legend_block.scad?raw";
import stemSocketScad from "../../scad/modules/stem_socket.scad?raw";
import standardPresetScad from "../../scad/presets/standard-1u.scad?raw";

export const KEYCAP_ENTRY_PATH = "/scad/base/keycap.scad";

const SCAD_FILES = [
  { path: "/scad/base/keycap.scad", content: keycapBaseScad },
  { path: "/scad/modules/keycap_shell.scad", content: keycapShellScad },
  { path: "/scad/modules/legend_block.scad", content: legendBlockScad },
  { path: "/scad/modules/stem_socket.scad", content: stemSocketScad },
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

export function createKeycapFiles() {
  return SCAD_FILES.map((file) => ({ ...file }));
}

export function buildKeycapArgs({ params, exportTarget, outputPath, outputFormat }) {
  const definitions = {
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
    user_stem_enabled: params.stemEnabled,
    user_stem_width: params.stemWidth,
    user_stem_depth: params.stemDepth,
    user_stem_height: params.stemHeight,
    user_stem_inset: params.stemInset,
  };

  return [
    KEYCAP_ENTRY_PATH,
    "-o",
    outputPath,
    "--backend=manifold",
    `--export-format=${outputFormat === "stl" ? "binstl" : outputFormat}`,
    ...Object.entries(definitions).map(
      ([key, value]) => `-D${key}=${formatDefinitionValue(value)}`,
    ),
  ];
}
