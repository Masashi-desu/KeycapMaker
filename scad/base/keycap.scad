include <../presets/standard-1u.scad>
use <../modules/keycap_shell.scad>
use <../modules/legend_block.scad>
use <../modules/stem_mx.scad>
use <../modules/stem_choc_v1.scad>
use <../modules/stem_choc_v2.scad>
use <../modules/stem_alps.scad>
use <../modules/homing_bar.scad>

resolved_export_target = is_undef(export_target) ? "preview" : export_target;
function positive_dimension(value, minimum = 0.1) = max(value, minimum);
function stem_cross_dimension(base_value, margin) =
    positive_dimension(base_value + margin * 2);
function supported_stem_type(type) =
    type == "none"
    || type == "mx"
    || type == "choc_v1"
    || type == "choc_v2"
    || type == "alps";
function cross_compatible_stem_type(type) =
    type == "mx" || type == "choc_v2";
function stem_default_outer_diameter(type) =
    type == "mx" ? default_stem_mx_outer_diameter : default_stem_choc_v2_outer_diameter;
function stem_default_inset(type) =
    type == "mx"
        ? default_stem_mx_inset
        : type == "choc_v1"
            ? default_stem_choc_v1_inset
            : type == "alps"
                ? default_stem_alps_inset
                : default_stem_choc_v2_inset;
function stem_default_height(type) =
    type == "mx"
        ? default_stem_mx_height
        : type == "choc_v1"
            ? default_stem_choc_v1_height
            : type == "alps"
                ? default_stem_alps_height
                : default_stem_choc_v2_height;
function stem_default_cross_width_horizontal(type) =
    type == "mx" ? default_stem_mx_cross_width_horizontal : default_stem_choc_v2_cross_width_horizontal;
function stem_default_cross_length_horizontal(type) =
    type == "mx" ? default_stem_mx_cross_length_horizontal : default_stem_choc_v2_cross_length_horizontal;
function stem_default_cross_width_vertical(type) =
    type == "mx" ? default_stem_mx_cross_width_vertical : default_stem_choc_v2_cross_width_vertical;
function stem_default_cross_length_vertical(type) =
    type == "mx" ? default_stem_mx_cross_length_vertical : default_stem_choc_v2_cross_length_vertical;
function stem_default_cross_chamfer(type) =
    type == "mx" ? default_stem_mx_cross_chamfer : default_stem_choc_v2_cross_chamfer;
function stem_plane_slope_magnitude(pitch_deg, roll_deg) =
    sqrt(pow(tan(pitch_deg), 2) + pow(tan(roll_deg), 2));
function stem_footprint_radius(type, outer_diameter, prong_width, prong_depth, prong_spacing, alps_length, alps_width) =
    type == "mx" || type == "choc_v2"
        ? positive_dimension(outer_diameter) / 2
        : type == "choc_v1"
            ? sqrt(pow(prong_spacing / 2 + prong_width / 2, 2) + pow(prong_depth / 2, 2))
            : type == "alps"
                ? sqrt(pow(alps_length / 2, 2) + pow(alps_width / 2, 2))
                : 0;

key_width = is_undef(user_key_width) ? default_key_width : user_key_width;
key_depth = is_undef(user_key_depth) ? default_key_depth : user_key_depth;
top_center_height = is_undef(user_top_center_height) ? default_top_center_height : user_top_center_height;
wall_thickness = is_undef(user_wall_thickness) ? default_wall_thickness : user_wall_thickness;
top_scale = is_undef(user_top_scale) ? default_top_scale : user_top_scale;

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
top_pitch_deg = is_undef(user_top_pitch_deg) ? default_top_pitch_deg : user_top_pitch_deg;
top_roll_deg = is_undef(user_top_roll_deg) ? default_top_roll_deg : user_top_roll_deg;

legend_enabled = is_undef(user_legend_enabled) ? true : user_legend_enabled;
legend_text = is_undef(user_legend_text) ? default_legend_text : user_legend_text;
legend_font_name = is_undef(user_legend_font_name) ? default_legend_font_name : user_legend_font_name;
legend_underline_enabled = is_undef(user_legend_underline_enabled)
    ? default_legend_underline_enabled
    : user_legend_underline_enabled;
legend_underline_width = is_undef(user_legend_underline_width)
    ? default_legend_underline_width
    : user_legend_underline_width;
legend_underline_thickness = is_undef(user_legend_underline_thickness)
    ? default_legend_underline_thickness
    : user_legend_underline_thickness;
legend_underline_offset_y = is_undef(user_legend_underline_offset_y)
    ? default_legend_underline_offset_y
    : user_legend_underline_offset_y;
legend_width = is_undef(user_legend_width) ? default_legend_width : user_legend_width;
legend_depth = is_undef(user_legend_depth) ? default_legend_depth : user_legend_depth;
legend_height = is_undef(user_legend_height) ? default_legend_height : user_legend_height;
legend_outline_delta = is_undef(user_legend_outline_delta) ? default_legend_outline_delta : user_legend_outline_delta;
legend_offset_x = is_undef(user_legend_offset_x) ? default_legend_offset_x : user_legend_offset_x;
legend_offset_y = is_undef(user_legend_offset_y) ? default_legend_offset_y : user_legend_offset_y;
requested_legend_embed = is_undef(user_legend_embed) ? default_legend_embed : user_legend_embed;
// Keep a thin body-colored floor under flush legends so the top shell remains continuous.
legend_bottom_skin = min(0.2, max(top_thickness * 0.5, 0.05));
legend_embed = min(max(requested_legend_embed, 0), max(top_thickness - legend_bottom_skin, 0));
// keycap_shell() builds the top face from a 0.01-thick slab, so subtraction must overshoot the surface slightly.
legend_visible_surface_overlap = 0.02;
legend_has_text = len(legend_text) > 0;
legend_surface_height = max(legend_height, 0);
legend_below_surface = legend_surface_height == 0
    ? max(legend_embed, max(top_thickness - legend_bottom_skin, 0))
    : legend_embed;
legend_total_height = max(legend_below_surface + legend_surface_height, 0);
legend_anchor_surface_z = keycap_surface_z(
    legend_offset_x,
    legend_offset_y,
    top_center_height,
    dish_depth,
    dish_radius,
    top_pitch_deg,
    top_roll_deg
);
legend_anchor_plane_z = keycap_top_plane_height(
    legend_offset_x,
    legend_offset_y,
    top_center_height,
    top_pitch_deg,
    top_roll_deg
);
legend_surface_delta = legend_anchor_surface_z - legend_anchor_plane_z;

requested_stem_type = is_undef(user_stem_type) ? default_stem_type : user_stem_type;
stem_type = supported_stem_type(requested_stem_type) ? requested_stem_type : default_stem_type;
stem_enabled = is_undef(user_stem_enabled)
    ? stem_type != "none"
    : user_stem_enabled && stem_type != "none";
stem_outer_delta = is_undef(user_stem_outer_delta) ? 0 : user_stem_outer_delta;
stem_cross_margin = is_undef(user_stem_cross_margin) ? 0 : user_stem_cross_margin;
stem_inset_delta = is_undef(user_stem_inset_delta) ? 0 : user_stem_inset_delta;
legacy_stem_width = is_undef(user_stem_width) ? default_stem_width : user_stem_width;
legacy_stem_depth = is_undef(user_stem_depth) ? default_stem_depth : user_stem_depth;
stem_outer_diameter = !is_undef(user_stem_outer_diameter)
    ? positive_dimension(user_stem_outer_diameter)
    : (!is_undef(user_stem_width) || !is_undef(user_stem_depth))
        ? positive_dimension(min(legacy_stem_width, legacy_stem_depth))
        : positive_dimension(stem_default_outer_diameter(stem_type) + stem_outer_delta);
stem_inset = is_undef(user_stem_inset)
    ? max(stem_default_inset(stem_type) + stem_inset_delta, 0)
    : max(user_stem_inset, 0);
stem_cross_width_horizontal = is_undef(user_stem_cross_width_horizontal)
    ? stem_cross_dimension(stem_default_cross_width_horizontal(stem_type), stem_cross_margin)
    : user_stem_cross_width_horizontal;
stem_cross_length_horizontal = is_undef(user_stem_cross_length_horizontal)
    ? stem_cross_dimension(stem_default_cross_length_horizontal(stem_type), stem_cross_margin)
    : user_stem_cross_length_horizontal;
stem_cross_width_vertical = is_undef(user_stem_cross_width_vertical)
    ? stem_cross_dimension(stem_default_cross_width_vertical(stem_type), stem_cross_margin)
    : user_stem_cross_width_vertical;
stem_cross_length_vertical = is_undef(user_stem_cross_length_vertical)
    ? stem_cross_dimension(stem_default_cross_length_vertical(stem_type), stem_cross_margin)
    : user_stem_cross_length_vertical;
stem_cross_chamfer = is_undef(user_stem_cross_chamfer)
    ? stem_default_cross_chamfer(stem_type)
    : user_stem_cross_chamfer;
stem_post_fit_delta = stem_cross_margin * 2;
stem_choc_v1_prong_width = positive_dimension(default_stem_choc_v1_prong_width - stem_post_fit_delta);
stem_choc_v1_prong_depth = positive_dimension(default_stem_choc_v1_prong_depth - stem_post_fit_delta);
stem_choc_v1_prong_spacing = default_stem_choc_v1_prong_spacing;
stem_choc_v1_lead_in = default_stem_choc_v1_lead_in;
stem_alps_length = positive_dimension(default_stem_alps_length - stem_post_fit_delta);
stem_alps_width = positive_dimension(default_stem_alps_width - stem_post_fit_delta);
stem_alps_lead_in = default_stem_alps_lead_in;
stem_clip_overlap = 0.05;
stem_safe_radius = stem_footprint_radius(
    stem_type,
    stem_outer_diameter,
    stem_choc_v1_prong_width,
    stem_choc_v1_prong_depth,
    stem_choc_v1_prong_spacing,
    stem_alps_length,
    stem_alps_width
);
stem_auto_contact_height = keycap_inner_height(top_center_height, dish_depth, top_thickness)
    + stem_safe_radius * stem_plane_slope_magnitude(top_pitch_deg, top_roll_deg)
    - stem_inset
    + stem_clip_overlap;
requested_stem_height = is_undef(user_stem_height)
    ? max(stem_default_height(stem_type), stem_auto_contact_height)
    : max(user_stem_height, 0.6);
stem_height = max(requested_stem_height, 0.6);

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
homing_bar_anchor_surface_z = keycap_surface_z(
    0,
    homing_bar_offset_y,
    top_center_height,
    dish_depth,
    dish_radius,
    top_pitch_deg,
    top_roll_deg
);
homing_bar_anchor_plane_z = keycap_top_plane_height(
    0,
    homing_bar_offset_y,
    top_center_height,
    top_pitch_deg,
    top_roll_deg
);
homing_bar_surface_delta = homing_bar_anchor_surface_z - homing_bar_anchor_plane_z;

module keycap_legend_volume(quality = "export") {
    if (legend_enabled && legend_has_text && legend_total_height > 0) {
        keycap_top_plane_transform(top_center_height, top_pitch_deg, top_roll_deg)
            legend_block(
                label = legend_text,
                width = legend_width,
                depth = legend_depth,
                height = legend_total_height,
                offset_x = legend_offset_x,
                offset_y = legend_offset_y,
                base_z = legend_surface_delta - legend_below_surface,
                font_name = legend_font_name,
                underline_enabled = legend_underline_enabled,
                underline_width = legend_underline_width,
                underline_thickness = legend_underline_thickness,
                underline_offset_y = legend_underline_offset_y,
                outline_delta = legend_outline_delta,
                quality = quality
            );
    }
}

module keycap_legend_visible_volume(quality = "export") {
    if (legend_enabled && legend_has_text && legend_total_height > 0) {
        keycap_top_plane_transform(top_center_height, top_pitch_deg, top_roll_deg)
            legend_block(
                label = legend_text,
                width = legend_width,
                depth = legend_depth,
                height = legend_total_height + legend_visible_surface_overlap,
                offset_x = legend_offset_x,
                offset_y = legend_offset_y,
                base_z = legend_surface_delta - legend_below_surface,
                font_name = legend_font_name,
                underline_enabled = legend_underline_enabled,
                underline_width = legend_underline_width,
                underline_thickness = legend_underline_thickness,
                underline_offset_y = legend_underline_offset_y,
                outline_delta = legend_outline_delta,
                quality = quality
            );
    }
}

module keycap_body_shell(quality = "export") {
    difference() {
        keycap_shell(
            width = key_width,
            depth = key_depth,
            top_center_height = top_center_height,
            wall = wall_thickness,
            top_thickness = top_thickness,
            front_angle = profile_front_angle,
            back_angle = profile_back_angle,
            left_angle = profile_left_angle,
            right_angle = profile_right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = top_pitch_deg,
            roll_deg = top_roll_deg,
            quality = quality
        );

        keycap_legend_visible_volume(quality);
    }
}

module keycap_body_core(quality = "export") {
    union() {
        keycap_body_shell(quality);
        keycap_stem(quality);
    }
}

module keycap_stem_nominal(quality = "export") {
    if (stem_enabled) {
        if (stem_type == "mx") {
            stem_mx(
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
        } else if (stem_type == "choc_v1") {
            stem_choc_v1(
                prong_width = stem_choc_v1_prong_width,
                prong_depth = stem_choc_v1_prong_depth,
                prong_spacing = stem_choc_v1_prong_spacing,
                stem_height = stem_height,
                base_clearance = stem_inset,
                lead_in = stem_choc_v1_lead_in,
                quality = quality
            );
        } else if (stem_type == "alps") {
            stem_alps(
                stem_length = stem_alps_length,
                stem_width = stem_alps_width,
                stem_height = stem_height,
                base_clearance = stem_inset,
                lead_in = stem_alps_lead_in,
                quality = quality
            );
        } else {
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

module keycap_stem_clip_volume(quality = "export") {
    if (stem_enabled) {
        translate([0, 0, stem_clip_overlap])
            keycap_inner_clearance_volume(
                width = key_width,
                depth = key_depth,
                top_center_height = top_center_height,
                wall = wall_thickness,
                top_thickness = top_thickness,
                dish_depth = dish_depth,
                front_angle = profile_front_angle,
                back_angle = profile_back_angle,
                left_angle = profile_left_angle,
                right_angle = profile_right_angle,
                bottom_corner_radius = bottom_corner_radius,
                top_corner_radius = top_corner_radius,
                pitch_deg = top_pitch_deg,
                roll_deg = top_roll_deg,
                quality = quality
            );
    }
}

module keycap_stem(quality = "export") {
    if (stem_enabled) {
        intersection() {
            keycap_stem_nominal(quality);
            keycap_stem_clip_volume(quality);
        }
    }
}

module keycap_homing_bar(quality = "export") {
    if (homing_bar_enabled) {
        keycap_top_plane_transform(top_center_height, top_pitch_deg, top_roll_deg)
            homing_bar_blank(
                length = homing_bar_length,
                width = homing_bar_width,
                height = homing_bar_height,
                base_thickness = homing_bar_base_thickness,
                offset_y = homing_bar_offset_y,
                base_z = homing_bar_surface_delta - homing_bar_base_thickness,
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
    keycap_legend_volume(quality);
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
