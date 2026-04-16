include <../presets/standard-1u.scad>
use <../modules/keycap_shell.scad>
use <../modules/legend_block.scad>
use <../modules/stem_socket.scad>

export_target = is_undef(export_target) ? "preview" : export_target;

key_width = is_undef(user_key_width) ? default_key_width : user_key_width;
key_depth = is_undef(user_key_depth) ? default_key_depth : user_key_depth;
body_height = is_undef(user_body_height) ? default_body_height : user_body_height;
wall_thickness = is_undef(user_wall_thickness) ? default_wall_thickness : user_wall_thickness;
top_scale = is_undef(user_top_scale) ? default_top_scale : user_top_scale;

legend_enabled = is_undef(user_legend_enabled) ? true : user_legend_enabled;
legend_width = is_undef(user_legend_width) ? default_legend_width : user_legend_width;
legend_depth = is_undef(user_legend_depth) ? default_legend_depth : user_legend_depth;
legend_height = is_undef(user_legend_height) ? default_legend_height : user_legend_height;
legend_offset_x = is_undef(user_legend_offset_x) ? default_legend_offset_x : user_legend_offset_x;
legend_offset_y = is_undef(user_legend_offset_y) ? default_legend_offset_y : user_legend_offset_y;

stem_enabled = is_undef(user_stem_enabled) ? true : user_stem_enabled;
stem_width = is_undef(user_stem_width) ? default_stem_width : user_stem_width;
stem_depth = is_undef(user_stem_depth) ? default_stem_depth : user_stem_depth;
stem_height = is_undef(user_stem_height) ? default_stem_height : user_stem_height;
stem_inset = is_undef(user_stem_inset) ? default_stem_inset : user_stem_inset;

module keycap_body() {
    difference() {
        keycap_shell(
            width = key_width,
            depth = key_depth,
            height = body_height,
            wall = wall_thickness,
            top_scale = top_scale
        );

        if (stem_enabled) {
            stem_socket(
                socket_width = stem_width,
                socket_depth = stem_depth,
                socket_height = stem_height,
                socket_inset = stem_inset
            );
        }
    }
}

module keycap_legend() {
    if (legend_enabled) {
        legend_block(
            width = legend_width,
            depth = legend_depth,
            height = legend_height,
            offset_x = legend_offset_x,
            offset_y = legend_offset_y,
            base_z = body_height
        );
    }
}

module preview_model() {
    union() {
        keycap_body();
        keycap_legend();
    }
}

if (export_target == "body") {
    keycap_body();
} else if (export_target == "legend") {
    keycap_legend();
} else {
    preview_model();
}
