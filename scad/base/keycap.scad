include <../presets/standard-1u.scad>
use <../modules/keycap_shell.scad>
use <../modules/legend_block.scad>
use <../modules/stem_choc_v2.scad>
use <../modules/homing_bar.scad>

resolved_export_target = is_undef(export_target) ? "preview" : export_target;

key_width = is_undef(user_key_width) ? default_key_width : user_key_width;
key_depth = is_undef(user_key_depth) ? default_key_depth : user_key_depth;
body_height = is_undef(user_body_height) ? default_body_height : user_body_height;
wall_thickness = is_undef(user_wall_thickness) ? default_wall_thickness : user_wall_thickness;
top_scale = is_undef(user_top_scale) ? default_top_scale : user_top_scale;

profile_shoulder_height = is_undef(user_profile_shoulder_height)
    ? default_profile_shoulder_height
    : user_profile_shoulder_height;

// Keep the legacy top-scale UI mapped onto the final profile's taper angles.
taper_factor = default_top_scale >= 1
    ? 1
    : max((1 - top_scale) / max(1 - default_top_scale, 0.01), 0);
profile_front_angle = is_undef(user_profile_front_angle)
    ? max(default_profile_front_angle * taper_factor, 0.1)
    : user_profile_front_angle;
profile_back_angle = is_undef(user_profile_back_angle)
    ? max(default_profile_back_angle * taper_factor, 0.1)
    : user_profile_back_angle;
profile_left_angle = is_undef(user_profile_left_angle)
    ? max(default_profile_left_angle * taper_factor, 0.1)
    : user_profile_left_angle;
profile_right_angle = is_undef(user_profile_right_angle)
    ? max(default_profile_right_angle * taper_factor, 0.1)
    : user_profile_right_angle;

top_thickness = is_undef(user_top_thickness) ? default_top_thickness : user_top_thickness;
bottom_corner_radius = is_undef(user_bottom_corner_radius)
    ? default_bottom_corner_radius
    : user_bottom_corner_radius;
top_corner_radius = is_undef(user_top_corner_radius)
    ? default_top_corner_radius
    : user_top_corner_radius;
dish_radius = is_undef(user_dish_radius) ? default_dish_radius : user_dish_radius;
dish_depth = is_undef(user_dish_depth) ? default_dish_depth : user_dish_depth;
top_tilt = is_undef(user_top_tilt) ? default_top_tilt : user_top_tilt;

legend_enabled = is_undef(user_legend_enabled) ? true : user_legend_enabled;
legend_text = is_undef(user_legend_text) ? default_legend_text : user_legend_text;
legend_font_name = is_undef(user_legend_font_name) ? default_legend_font_name : user_legend_font_name;
legend_weight = is_undef(user_legend_weight) ? default_legend_weight : user_legend_weight;
legend_slant = is_undef(user_legend_slant) ? default_legend_slant : user_legend_slant;
legend_underline_enabled = is_undef(user_legend_underline_enabled)
    ? default_legend_underline_enabled
    : user_legend_underline_enabled;
legend_width = is_undef(user_legend_width) ? default_legend_width : user_legend_width;
legend_depth = is_undef(user_legend_depth) ? default_legend_depth : user_legend_depth;
legend_height = is_undef(user_legend_height) ? default_legend_height : user_legend_height;
legend_offset_x = is_undef(user_legend_offset_x) ? default_legend_offset_x : user_legend_offset_x;
legend_offset_y = is_undef(user_legend_offset_y) ? default_legend_offset_y : user_legend_offset_y;
legend_embed = is_undef(user_legend_embed) ? default_legend_embed : user_legend_embed;
legend_has_text = len(legend_text) > 0;
legend_surface_height = max(legend_height, 0);
legend_total_height = max(legend_embed + legend_surface_height, 0);
legend_curve_margin = (key_width * key_width) / max(dish_radius * 8, 0.1);
legend_tilt_margin = abs(tan(top_tilt)) * key_depth;
legend_projection_margin = max(dish_depth + legend_curve_margin + legend_tilt_margin + 0.5, 1);

stem_enabled = is_undef(user_stem_enabled) ? true : user_stem_enabled;
stem_width = is_undef(user_stem_width) ? default_stem_width : user_stem_width;
stem_depth = is_undef(user_stem_depth) ? default_stem_depth : user_stem_depth;
stem_outer_diameter = is_undef(user_stem_outer_diameter)
    ? min(stem_width, stem_depth)
    : user_stem_outer_diameter;
stem_inset = is_undef(user_stem_inset) ? default_stem_inset : user_stem_inset;
stem_height = is_undef(user_stem_height)
    ? max(body_height - dish_depth - top_thickness - stem_inset, 0.6)
    : user_stem_height;
stem_cross_width_horizontal = is_undef(user_stem_cross_width_horizontal)
    ? default_stem_cross_width_horizontal
    : user_stem_cross_width_horizontal;
stem_cross_length_horizontal = is_undef(user_stem_cross_length_horizontal)
    ? default_stem_cross_length_horizontal
    : user_stem_cross_length_horizontal;
stem_cross_width_vertical = is_undef(user_stem_cross_width_vertical)
    ? default_stem_cross_width_vertical
    : user_stem_cross_width_vertical;
stem_cross_length_vertical = is_undef(user_stem_cross_length_vertical)
    ? default_stem_cross_length_vertical
    : user_stem_cross_length_vertical;
stem_cross_chamfer = is_undef(user_stem_cross_chamfer)
    ? default_stem_cross_chamfer
    : user_stem_cross_chamfer;

homing_bar_enabled = is_undef(user_homing_bar_enabled)
    ? default_homing_bar_enabled
    : user_homing_bar_enabled;
homing_bar_height = is_undef(user_homing_bar_height)
    ? default_homing_bar_height
    : user_homing_bar_height;
homing_bar_length = is_undef(user_homing_bar_length)
    ? default_homing_bar_length
    : user_homing_bar_length;
homing_bar_width = is_undef(user_homing_bar_width)
    ? default_homing_bar_width
    : user_homing_bar_width;
homing_bar_offset_y = is_undef(user_homing_bar_offset_y)
    ? default_homing_bar_offset_y
    : user_homing_bar_offset_y;
homing_bar_base_thickness = is_undef(user_homing_bar_base_thickness)
    ? default_homing_bar_base_thickness
    : user_homing_bar_base_thickness;

legend_surface_z = keycap_center_surface_z(body_height, dish_depth);
legend_base_z = legend_surface_z - legend_embed;
legend_projection_base_z = legend_base_z - legend_projection_margin;
legend_projection_height = legend_total_height + legend_projection_margin * 2;
homing_bar_base_z = keycap_center_surface_z(body_height, dish_depth) - homing_bar_base_thickness;

module keycap_body_core(quality = "export") {
    union() {
        keycap_shell(
            width = key_width,
            depth = key_depth,
            cap_height = body_height,
            wall = wall_thickness,
            top_thickness = top_thickness,
            shoulder_height = profile_shoulder_height,
            front_angle = profile_front_angle,
            back_angle = profile_back_angle,
            left_angle = profile_left_angle,
            right_angle = profile_right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            top_tilt = top_tilt,
            quality = quality
        );

        if (stem_enabled) {
            stem_choc_v2(
                outer_diameter = stem_outer_diameter,
                stem_height = stem_height,
                base_clearance = stem_inset,
                cross_width_horizontal = stem_cross_width_horizontal,
                cross_length_horizontal = stem_cross_length_horizontal,
                cross_width_vertical = stem_cross_width_vertical,
                cross_length_vertical = stem_cross_length_vertical,
                cross_chamfer = stem_cross_chamfer,
                quality = quality
            );
        }
    }
}

module keycap_homing_bar(quality = "export") {
    if (homing_bar_enabled) {
        homing_bar_blank(
            length = homing_bar_length,
            width = homing_bar_width,
            height = homing_bar_height,
            base_thickness = homing_bar_base_thickness,
            offset_y = homing_bar_offset_y,
            base_z = homing_bar_base_z,
            quality = quality
        );
    }
}

module keycap_body(quality = "export") {
    union() {
        keycap_body_core(quality);
        keycap_homing_bar(quality);
    }
}

module keycap_legend(quality = "export") {
    if (legend_enabled && legend_has_text && legend_total_height > 0) {
        intersection() {
            legend_block(
                label = legend_text,
                width = legend_width,
                depth = legend_depth,
                height = legend_projection_height,
                offset_x = legend_offset_x,
                offset_y = legend_offset_y,
                base_z = legend_projection_base_z,
                font_name = legend_font_name,
                weight = legend_weight,
                slant = legend_slant,
                underline_enabled = legend_underline_enabled
            );

            keycap_dish_band(
                depth = key_depth,
                cap_height = body_height,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                top_tilt = top_tilt,
                below_surface = legend_embed,
                above_surface = legend_surface_height,
                quality = quality
            );
        }
    }
}

module export_body() {
    keycap_body("export");
}

module export_body_core() {
    keycap_body_core("export");
}

module export_homing() {
    keycap_homing_bar("export");
}

module export_legend() {
    keycap_legend("export");
}

module preview_model() {
    union() {
        keycap_body("preview");
        keycap_legend("preview");
    }
}

if (resolved_export_target == "body") {
    export_body();
} else if (resolved_export_target == "body_core") {
    export_body_core();
} else if (resolved_export_target == "homing") {
    export_homing();
} else if (resolved_export_target == "legend") {
    export_legend();
} else {
    preview_model();
}
