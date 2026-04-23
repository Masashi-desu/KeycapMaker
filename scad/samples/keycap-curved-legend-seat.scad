export_target = "body_core";

include <common/custom-shell-params.scad>

user_key_width = 18;
user_key_depth = 18;
user_top_center_height = 9.5;
user_top_pitch_deg = 0;
user_top_roll_deg = 0;
user_wall_thickness = 1.2;
user_top_scale = 0.84;
user_top_shape_type = "spherical";
user_dish_radius = 45;
user_dish_depth = 1.0;

user_legend_enabled = true;
user_legend_text = "A";
user_legend_font_name = "M PLUS 1:style=Regular";
user_legend_underline_enabled = false;
user_legend_width = 7.2;
user_legend_depth = 4.0;
user_legend_height = 0;
user_legend_embed = 0.6;
user_legend_outline_delta = 0;

user_homing_bar_enabled = false;
user_stem_type = "choc_v2";
user_stem_outer_delta = 0;
user_stem_cross_margin = 0;
user_stem_inset_delta = 0;

include <../base/keycap.scad>
