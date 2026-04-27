include <../presets/stem-nominals.scad>
use <../modules/keycap_shell.scad>
use <../modules/keycap_jis_enter.scad>
use <../modules/keycap_typewriter.scad>
use <../modules/legend_block.scad>
use <../modules/stem_mx.scad>
use <../modules/stem_choc_v1.scad>
use <../modules/stem_choc_v2.scad>
use <../modules/stem_alps.scad>
use <../modules/homing_bar.scad>

resolved_export_target = is_undef(export_target) ? "preview" : export_target;
function required_param(value, name) =
    assert(!is_undef(value), str(name, " is required"))
    value;
function positive_dimension(value, minimum = 0.1) = max(value, minimum);
function stem_cross_dimension(base_value, margin) =
    positive_dimension(base_value + margin * 2);
function supported_shape_geometry_type(type) =
    type == "shell"
    || type == "jis_enter"
    || type == "typewriter"
    || type == "typewriter_jis_enter";
function typewriter_shape_geometry_type(type) =
    type == "typewriter" || type == "typewriter_jis_enter";
function jis_enter_shape_geometry_type(type) =
    type == "jis_enter" || type == "typewriter_jis_enter";
function supported_top_shape_type(type) =
    type == "flat" || type == "cylindrical" || type == "spherical";
function supported_stem_type(type) =
    type == "none"
    || type == "mx"
    || type == "choc_v1"
    || type == "choc_v2"
    || type == "alps";
function cross_compatible_stem_type(type) =
    type == "mx" || type == "choc_v2";
function stem_nominal_outer_diameter_for_type(type) =
    type == "mx" ? stem_mx_nominal_outer_diameter : stem_choc_v2_nominal_outer_diameter;
function stem_nominal_inset_for_type(type) =
    type == "mx"
        ? stem_mx_nominal_inset
        : type == "choc_v1"
            ? stem_choc_v1_nominal_inset
            : type == "alps"
                ? stem_alps_nominal_inset
                : stem_choc_v2_nominal_inset;
function stem_nominal_height_for_type(type) =
    type == "mx"
        ? stem_mx_nominal_height
        : type == "choc_v1"
            ? stem_choc_v1_nominal_height
            : type == "alps"
                ? stem_alps_nominal_height
                : stem_choc_v2_nominal_height;
function stem_nominal_cross_width_horizontal_for_type(type) =
    type == "mx" ? stem_mx_nominal_cross_width_horizontal : stem_choc_v2_nominal_cross_width_horizontal;
function stem_nominal_cross_length_horizontal_for_type(type) =
    type == "mx" ? stem_mx_nominal_cross_length_horizontal : stem_choc_v2_nominal_cross_length_horizontal;
function stem_nominal_cross_width_vertical_for_type(type) =
    type == "mx" ? stem_mx_nominal_cross_width_vertical : stem_choc_v2_nominal_cross_width_vertical;
function stem_nominal_cross_length_vertical_for_type(type) =
    type == "mx" ? stem_mx_nominal_cross_length_vertical : stem_choc_v2_nominal_cross_length_vertical;
function stem_nominal_cross_chamfer_for_type(type) =
    type == "mx" ? stem_mx_nominal_cross_chamfer : stem_choc_v2_nominal_cross_chamfer;
function stem_plane_slope_magnitude(pitch_deg, roll_deg) =
    sqrt(pow(tan(pitch_deg), 2) + pow(tan(roll_deg), 2));
typewriter_stem_mount_overlap = 0.02;
typewriter_rim_body_clearance = 0.03;
function typewriter_stem_height_from_mount_height(mount_height, top_height) =
    max(mount_height - top_height + typewriter_stem_mount_overlap, 0.6);
function stem_footprint_radius(type, outer_diameter, prong_width, prong_depth, prong_spacing, alps_length, alps_width) =
    type == "mx" || type == "choc_v2"
        ? positive_dimension(outer_diameter) / 2
        : type == "choc_v1"
            ? sqrt(pow(prong_spacing / 2 + prong_width / 2, 2) + pow(prong_depth / 2, 2))
            : type == "alps"
                ? sqrt(pow(alps_length / 2, 2) + pow(alps_width / 2, 2))
                : 0;

key_width = positive_dimension(required_param(user_key_width, "user_key_width"));
key_depth = positive_dimension(required_param(user_key_depth, "user_key_depth"));
top_center_height = positive_dimension(required_param(user_top_center_height, "user_top_center_height"));
wall_thickness = positive_dimension(required_param(user_wall_thickness, "user_wall_thickness"));
requested_shape_geometry_type = required_param(user_shape_geometry_type, "user_shape_geometry_type");
shape_geometry_type = assert(
    supported_shape_geometry_type(requested_shape_geometry_type),
    str("unsupported user_shape_geometry_type: ", requested_shape_geometry_type)
) requested_shape_geometry_type;
typewriter_mount_height = typewriter_shape_geometry_type(shape_geometry_type)
    ? positive_dimension(required_param(user_typewriter_mount_height, "user_typewriter_mount_height"))
    : 0;
typewriter_corner_radius = max(required_param(user_typewriter_corner_radius, "user_typewriter_corner_radius"), 0);
jis_enter_notch_width = jis_enter_shape_geometry_type(shape_geometry_type)
    ? max(required_param(user_jis_enter_notch_width, "user_jis_enter_notch_width"), 0)
    : 0;
jis_enter_notch_depth = jis_enter_shape_geometry_type(shape_geometry_type)
    ? max(required_param(user_jis_enter_notch_depth, "user_jis_enter_notch_depth"), 0)
    : 0;

profile_front_angle = required_param(user_profile_front_angle, "user_profile_front_angle");
profile_back_angle = required_param(user_profile_back_angle, "user_profile_back_angle");
profile_left_angle = required_param(user_profile_left_angle, "user_profile_left_angle");
profile_right_angle = required_param(user_profile_right_angle, "user_profile_right_angle");

top_thickness = max(required_param(user_top_thickness, "user_top_thickness"), 0.05);
bottom_corner_radius = max(required_param(user_bottom_corner_radius, "user_bottom_corner_radius"), 0);
top_corner_radius = max(required_param(user_top_corner_radius, "user_top_corner_radius"), 0);
dish_radius = positive_dimension(required_param(user_dish_radius, "user_dish_radius"));
requested_dish_depth = required_param(user_dish_depth, "user_dish_depth");
requested_top_shape_type = is_undef(user_top_shape_type)
    ? (abs(requested_dish_depth) > 0.001 ? "spherical" : "flat")
    : user_top_shape_type;
top_shape_type = assert(
    supported_top_shape_type(requested_top_shape_type),
    str("unsupported user_top_shape_type: ", requested_top_shape_type)
) requested_top_shape_type;
dish_depth = top_shape_type == "flat" ? 0 : requested_dish_depth;
top_pitch_deg = required_param(user_top_pitch_deg, "user_top_pitch_deg");
top_roll_deg = required_param(user_top_roll_deg, "user_top_roll_deg");
top_offset_x = required_param(user_top_offset_x, "user_top_offset_x");
top_offset_y = required_param(user_top_offset_y, "user_top_offset_y");
requested_top_hat_enabled = required_param(user_top_hat_enabled, "user_top_hat_enabled");
top_hat_top_width = positive_dimension(required_param(user_top_hat_top_width, "user_top_hat_top_width"));
top_hat_top_depth = positive_dimension(required_param(user_top_hat_top_depth, "user_top_hat_top_depth"));
top_hat_inset = max(required_param(user_top_hat_inset, "user_top_hat_inset"), 0);
top_hat_top_radius = max(required_param(user_top_hat_top_radius, "user_top_hat_top_radius"), 0);
requested_top_hat_height = required_param(user_top_hat_height, "user_top_hat_height");
top_hat_recess_limit = max(top_thickness - 0.05, 0);
top_hat_height = requested_top_hat_height < 0
    ? max(requested_top_hat_height, -top_hat_recess_limit)
    : requested_top_hat_height;
top_hat_shoulder_angle = keycap_top_hat_safe_shoulder_angle(required_param(user_top_hat_shoulder_angle, "user_top_hat_shoulder_angle"));
top_hat_shoulder_radius = keycap_top_hat_safe_shoulder_radius(required_param(user_top_hat_shoulder_radius, "user_top_hat_shoulder_radius"));
top_hat_enabled = (shape_geometry_type == "shell" || shape_geometry_type == "jis_enter")
    && requested_top_hat_enabled
    && abs(top_hat_height) > 0.001;
top_hat_surface_z_shift = top_hat_enabled
    ? keycap_dish_surface_offset(
        0,
        0,
        top_shape_type,
        dish_depth,
        dish_radius,
        key_width,
        key_depth
    )
    : 0;
active_top_center_height = top_hat_enabled
    ? top_center_height + top_hat_surface_z_shift + top_hat_height
    : top_center_height;
active_top_shape_type = top_hat_enabled ? "flat" : top_shape_type;
active_dish_depth = top_hat_enabled ? 0 : dish_depth;
requested_rim_enabled = required_param(user_rim_enabled, "user_rim_enabled");
rim_width = max(required_param(user_rim_width, "user_rim_width"), 0);
rim_height_up = max(required_param(user_rim_height_up, "user_rim_height_up"), 0);
rim_height_down = max(required_param(user_rim_height_down, "user_rim_height_down"), 0);
rim_enabled = typewriter_shape_geometry_type(shape_geometry_type) && requested_rim_enabled && rim_width > 0.001;

legend_enabled = required_param(user_legend_enabled, "user_legend_enabled");
legend_text = required_param(user_legend_text, "user_legend_text");
legend_font_name = required_param(user_legend_font_name, "user_legend_font_name");
legend_underline_enabled = required_param(user_legend_underline_enabled, "user_legend_underline_enabled");
legend_underline_width = max(required_param(user_legend_underline_width, "user_legend_underline_width"), 0);
legend_underline_thickness = max(required_param(user_legend_underline_thickness, "user_legend_underline_thickness"), 0);
legend_underline_offset_y = required_param(user_legend_underline_offset_y, "user_legend_underline_offset_y");
legend_width = positive_dimension(required_param(user_legend_width, "user_legend_width"));
legend_depth = positive_dimension(required_param(user_legend_depth, "user_legend_depth"));
legend_text_size_value = positive_dimension(is_undef(user_legend_text_size) ? legend_depth : user_legend_text_size);
legend_height = max(required_param(user_legend_height, "user_legend_height"), 0);
legend_outline_delta = required_param(user_legend_outline_delta, "user_legend_outline_delta");
legend_offset_x = required_param(user_legend_offset_x, "user_legend_offset_x");
legend_offset_y = required_param(user_legend_offset_y, "user_legend_offset_y");
requested_legend_embed = max(required_param(user_legend_embed, "user_legend_embed"), 0);
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
legend_plan_left = legend_offset_x - legend_width / 2;
legend_plan_right = legend_offset_x + legend_width / 2;
legend_plan_front = legend_offset_y - legend_depth / 2;
legend_plan_back = legend_offset_y + legend_depth / 2;
legend_plan_radius = 0;

requested_stem_type = required_param(user_stem_type, "user_stem_type");
stem_type = assert(
    supported_stem_type(requested_stem_type),
    str("unsupported user_stem_type: ", requested_stem_type)
) requested_stem_type;
stem_enabled = required_param(user_stem_enabled, "user_stem_enabled") && stem_type != "none";
stem_outer_delta = required_param(user_stem_outer_delta, "user_stem_outer_delta");
stem_cross_margin = required_param(user_stem_cross_margin, "user_stem_cross_margin");
stem_inset_delta = required_param(user_stem_inset_delta, "user_stem_inset_delta");
legacy_stem_width = is_undef(user_stem_width) ? legacy_stem_nominal_width : user_stem_width;
legacy_stem_depth = is_undef(user_stem_depth) ? legacy_stem_nominal_depth : user_stem_depth;
stem_outer_diameter = !is_undef(user_stem_outer_diameter)
    ? positive_dimension(user_stem_outer_diameter)
    : (!is_undef(user_stem_width) || !is_undef(user_stem_depth))
        ? positive_dimension(min(legacy_stem_width, legacy_stem_depth))
        : positive_dimension(stem_nominal_outer_diameter_for_type(stem_type) + stem_outer_delta);
stem_inset = is_undef(user_stem_inset)
    ? max(stem_nominal_inset_for_type(stem_type) + stem_inset_delta, 0)
    : max(user_stem_inset, 0);
stem_cross_width_horizontal = is_undef(user_stem_cross_width_horizontal)
    ? stem_cross_dimension(stem_nominal_cross_width_horizontal_for_type(stem_type), stem_cross_margin)
    : user_stem_cross_width_horizontal;
stem_cross_length_horizontal = is_undef(user_stem_cross_length_horizontal)
    ? stem_cross_dimension(stem_nominal_cross_length_horizontal_for_type(stem_type), stem_cross_margin)
    : user_stem_cross_length_horizontal;
stem_cross_width_vertical = is_undef(user_stem_cross_width_vertical)
    ? stem_cross_dimension(stem_nominal_cross_width_vertical_for_type(stem_type), stem_cross_margin)
    : user_stem_cross_width_vertical;
stem_cross_length_vertical = is_undef(user_stem_cross_length_vertical)
    ? stem_cross_dimension(stem_nominal_cross_length_vertical_for_type(stem_type), stem_cross_margin)
    : user_stem_cross_length_vertical;
stem_cross_chamfer = is_undef(user_stem_cross_chamfer)
    ? stem_nominal_cross_chamfer_for_type(stem_type)
    : user_stem_cross_chamfer;
stem_post_fit_delta = stem_cross_margin * 2;
stem_choc_v1_prong_width = positive_dimension(stem_choc_v1_nominal_prong_width - stem_post_fit_delta);
stem_choc_v1_prong_depth = positive_dimension(stem_choc_v1_nominal_prong_depth - stem_post_fit_delta);
stem_choc_v1_prong_spacing = stem_choc_v1_nominal_prong_spacing;
stem_choc_v1_lead_in = stem_choc_v1_nominal_lead_in;
stem_alps_length = positive_dimension(stem_alps_nominal_length - stem_post_fit_delta);
stem_alps_width = positive_dimension(stem_alps_nominal_width - stem_post_fit_delta);
stem_alps_lead_in = stem_alps_nominal_lead_in;
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
    + abs(top_offset_x * tan(top_roll_deg))
    + abs(top_offset_y * tan(top_pitch_deg))
    - stem_inset
    + stem_clip_overlap;
typewriter_stem_height = typewriter_stem_height_from_mount_height(typewriter_mount_height, top_center_height);
requested_stem_height = is_undef(user_stem_height)
    ? (
        typewriter_shape_geometry_type(shape_geometry_type)
            ? typewriter_stem_height
            : max(stem_nominal_height_for_type(stem_type), stem_auto_contact_height)
    )
    : max(user_stem_height, 0.6);
stem_height = max(requested_stem_height, 0.6);

homing_bar_enabled = required_param(user_homing_bar_enabled, "user_homing_bar_enabled");
homing_bar_height = max(required_param(user_homing_bar_height, "user_homing_bar_height"), 0);
homing_bar_length = positive_dimension(required_param(user_homing_bar_length, "user_homing_bar_length"));
homing_bar_width = positive_dimension(required_param(user_homing_bar_width, "user_homing_bar_width"));
homing_bar_offset_y = required_param(user_homing_bar_offset_y, "user_homing_bar_offset_y");
homing_bar_base_thickness = 0.35;
homing_bar_chamfer = max(is_undef(user_homing_bar_chamfer) ? 0 : user_homing_bar_chamfer, 0);
homing_bar_anchor_surface_z = keycap_surface_z(
    0,
    homing_bar_offset_y,
    active_top_center_height,
    active_top_shape_type,
    active_dish_depth,
    dish_radius,
    top_pitch_deg,
    top_roll_deg,
    key_width,
    key_depth
);
homing_bar_anchor_plane_z = keycap_top_plane_height(
    0,
    homing_bar_offset_y,
    active_top_center_height,
    top_pitch_deg,
    top_roll_deg
);
homing_bar_surface_delta = homing_bar_anchor_surface_z - homing_bar_anchor_plane_z;

module keycap_legend_flat_block(height = legend_total_height, quality = "export") {
    if (legend_enabled && legend_has_text && legend_total_height > 0) {
        keycap_top_plane_transform(active_top_center_height, top_pitch_deg, top_roll_deg, top_offset_x, top_offset_y)
            legend_block(
                label = legend_text,
                width = legend_width,
                depth = legend_depth,
                height = height,
                offset_x = legend_offset_x,
                offset_y = legend_offset_y,
                base_z = -legend_below_surface,
                font_name = legend_font_name,
                underline_enabled = legend_underline_enabled,
                underline_width = legend_underline_width,
                underline_thickness = legend_underline_thickness,
                underline_offset_y = legend_underline_offset_y,
                outline_delta = legend_outline_delta,
                text_size = legend_text_size_value,
                quality = quality
            );
    }
}

module keycap_legend_surface_volume(top_overlap = 0, quality = "export") {
    if (legend_enabled && legend_has_text && legend_total_height > 0) {
        intersection() {
            keycap_legend_flat_block(
                height = legend_total_height + top_overlap,
                quality = quality
            );

            keycap_top_surface_region(
                left = legend_plan_left,
                right = legend_plan_right,
                front = legend_plan_front,
                back = legend_plan_back,
                radius = legend_plan_radius,
                top_center_height = active_top_center_height,
                dish_type = active_top_shape_type,
                dish_depth = active_dish_depth,
                dish_radius = dish_radius,
                pitch_deg = top_pitch_deg,
                roll_deg = top_roll_deg,
                base_z = -legend_below_surface,
                top_extra_z = legend_surface_height + top_overlap,
                dish_plan_width = key_width,
                dish_plan_depth = key_depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_legend_volume(quality = "export") {
    keycap_legend_surface_volume(0, quality);
}

module keycap_legend_visible_volume(quality = "export") {
    keycap_legend_surface_volume(legend_visible_surface_overlap, quality);
}

module keycap_body_shell_positive(quality = "export") {
    if (shape_geometry_type == "typewriter") {
        keycap_typewriter_cap(
            width = key_width,
            depth = key_depth,
            top_center_height = top_center_height,
            corner_radius = typewriter_corner_radius,
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = top_pitch_deg,
            roll_deg = top_roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
    } else if (shape_geometry_type == "typewriter_jis_enter") {
        keycap_jis_enter_typewriter_shell(
            width = key_width,
            depth = key_depth,
            top_center_height = top_center_height,
            notch_width = jis_enter_notch_width,
            notch_depth = jis_enter_notch_depth,
            corner_radius = typewriter_corner_radius,
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = top_pitch_deg,
            roll_deg = top_roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
    } else if (shape_geometry_type == "jis_enter") {
        keycap_jis_enter_shell(
            width = key_width,
            depth = key_depth,
            top_center_height = top_center_height,
            notch_width = jis_enter_notch_width,
            notch_depth = jis_enter_notch_depth,
            wall = wall_thickness,
            top_thickness = top_thickness,
            front_angle = profile_front_angle,
            back_angle = profile_back_angle,
            left_angle = profile_left_angle,
            right_angle = profile_right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            top_hat_enabled = top_hat_enabled,
            top_hat_inset = top_hat_inset,
            top_hat_top_radius = top_hat_top_radius,
            top_hat_height = top_hat_height,
            top_hat_shoulder_angle = top_hat_shoulder_angle,
            top_hat_shoulder_radius = top_hat_shoulder_radius,
            pitch_deg = top_pitch_deg,
            roll_deg = top_roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
    } else {
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
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            top_hat_enabled = top_hat_enabled,
            top_hat_top_width = top_hat_top_width,
            top_hat_top_depth = top_hat_top_depth,
            top_hat_top_radius = top_hat_top_radius,
            top_hat_height = top_hat_height,
            top_hat_shoulder_angle = top_hat_shoulder_angle,
            top_hat_shoulder_radius = top_hat_shoulder_radius,
            pitch_deg = top_pitch_deg,
            roll_deg = top_roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
    }
}

module keycap_body_shell(quality = "export") {
    difference() {
        keycap_body_shell_positive(quality);
        keycap_legend_visible_volume(quality);
        if (rim_enabled) {
            keycap_body_rim_clearance_volume(quality);
        }
    }
}

module keycap_body_rim_clearance_volume(quality = "export") {
    if (rim_enabled) {
        clearance = typewriter_rim_body_clearance;

        if (shape_geometry_type == "typewriter_jis_enter") {
            keycap_jis_enter_typewriter_rim(
                width = key_width + clearance * 2,
                depth = key_depth + clearance * 2,
                top_center_height = top_center_height + clearance,
                notch_width = jis_enter_notch_width,
                notch_depth = jis_enter_notch_depth,
                band_width = rim_width + clearance * 2,
                height_up = rim_height_up + clearance,
                height_down = rim_height_down + clearance,
                corner_radius = typewriter_corner_radius + clearance,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = top_pitch_deg,
                roll_deg = top_roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        } else {
            keycap_typewriter_rim(
                width = key_width + clearance * 2,
                depth = key_depth + clearance * 2,
                top_center_height = top_center_height + clearance,
                band_width = rim_width + clearance * 2,
                height_up = rim_height_up + clearance,
                height_down = rim_height_down + clearance,
                corner_radius = typewriter_corner_radius + clearance,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = top_pitch_deg,
                roll_deg = top_roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_body_core(quality = "export") {
    union() {
        keycap_body_shell(quality);
        keycap_stem(quality);
    }
}

module keycap_stem_positive(base_clearance = stem_inset, quality = "export") {
    if (stem_type == "mx") {
        stem_mx(
            outer_diameter = stem_outer_diameter,
            stem_height = stem_height,
            base_clearance = base_clearance,
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
            base_clearance = base_clearance,
            lead_in = stem_choc_v1_lead_in,
            quality = quality
        );
    } else if (stem_type == "alps") {
        stem_alps(
            stem_length = stem_alps_length,
            stem_width = stem_alps_width,
            stem_height = stem_height,
            base_clearance = base_clearance,
            lead_in = stem_alps_lead_in,
            quality = quality
        );
    } else {
        stem_choc_v2(
            outer_diameter = stem_outer_diameter,
            stem_height = stem_height,
            base_clearance = base_clearance,
            cross_width_horizontal = stem_cross_width_horizontal,
            cross_length_horizontal = stem_cross_length_horizontal,
            cross_width_vertical = stem_cross_width_vertical,
            cross_length_vertical = stem_cross_length_vertical,
            cross_chamfer = stem_cross_chamfer,
            quality = quality
        );
    }
}

module keycap_stem_nominal(quality = "export") {
    if (stem_enabled) {
        if (typewriter_shape_geometry_type(shape_geometry_type)) {
            translate([0, 0, typewriter_stem_mount_overlap])
                mirror([0, 0, 1])
                    keycap_stem_positive(base_clearance = 0, quality = quality);
        } else {
            keycap_stem_positive(base_clearance = stem_inset, quality = quality);
        }
    }
}

module keycap_stem_clip_volume(quality = "export") {
    if (stem_enabled) {
        translate([0, 0, stem_clip_overlap])
            if (shape_geometry_type == "jis_enter") {
                keycap_jis_enter_inner_clearance_volume(
                    width = key_width,
                    depth = key_depth,
                    top_center_height = top_center_height,
                    notch_width = jis_enter_notch_width,
                    notch_depth = jis_enter_notch_depth,
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
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );
            } else {
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
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );
            }
    }
}

module keycap_stem(quality = "export") {
    if (stem_enabled) {
        if (typewriter_shape_geometry_type(shape_geometry_type)) {
            keycap_stem_nominal(quality);
        } else {
            intersection() {
                keycap_stem_nominal(quality);
                keycap_stem_clip_volume(quality);
            }
        }
    }
}

module keycap_homing_bar(quality = "export") {
    if (homing_bar_enabled) {
        keycap_top_plane_transform(active_top_center_height, top_pitch_deg, top_roll_deg, top_offset_x, top_offset_y)
            homing_bar_blank(
                length = homing_bar_length,
                width = homing_bar_width,
                height = homing_bar_height,
                base_thickness = homing_bar_base_thickness,
                offset_y = homing_bar_offset_y,
                base_z = homing_bar_surface_delta - homing_bar_base_thickness,
                chamfer = homing_bar_chamfer,
                quality = quality
            );
    }
}

module keycap_rim_positive(quality = "export") {
    if (rim_enabled) {
        if (shape_geometry_type == "typewriter_jis_enter") {
            keycap_jis_enter_typewriter_rim(
                width = key_width,
                depth = key_depth,
                top_center_height = top_center_height,
                notch_width = jis_enter_notch_width,
                notch_depth = jis_enter_notch_depth,
                band_width = rim_width,
                height_up = rim_height_up,
                height_down = rim_height_down,
                corner_radius = typewriter_corner_radius,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = top_pitch_deg,
                roll_deg = top_roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        } else {
            keycap_typewriter_rim(
                width = key_width,
                depth = key_depth,
                top_center_height = top_center_height,
                band_width = rim_width,
                height_up = rim_height_up,
                height_down = rim_height_down,
                corner_radius = typewriter_corner_radius,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = top_pitch_deg,
                roll_deg = top_roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_rim(quality = "export") {
    if (rim_enabled) {
        difference() {
            keycap_rim_positive(quality);
            keycap_legend_visible_volume(quality);
        }
    }
}

module keycap_body(quality = "export") {
    union() {
        keycap_body_core(quality);
        keycap_homing_bar(quality);
    }
}

module keycap_single_material_shape(quality = "export") {
    union() {
        keycap_body_shell_positive(quality);
        keycap_stem(quality);
        keycap_homing_bar(quality);
        keycap_rim_positive(quality);
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

module export_rim() {
    keycap_rim("export");
}

module export_legend() {
    keycap_legend("export");
}

module export_single_material_shape() {
    keycap_single_material_shape("export");
}

module preview_model() {
    union() {
        keycap_body("preview");
        keycap_rim("preview");
        keycap_legend("preview");
    }
}

if (resolved_export_target == "body") {
    export_body();
} else if (resolved_export_target == "body_core") {
    export_body_core();
} else if (resolved_export_target == "homing") {
    export_homing();
} else if (resolved_export_target == "rim") {
    export_rim();
} else if (resolved_export_target == "legend") {
    export_legend();
} else if (resolved_export_target == "single_material_shape") {
    export_single_material_shape();
} else {
    preview_model();
}
