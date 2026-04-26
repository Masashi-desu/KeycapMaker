export_target = "preview";

include <common/custom-shell-params.scad>

user_key_width = 36;
user_key_depth = 18;
user_top_center_height = 9.8;
user_wall_thickness = 1.2;
user_profile_front_angle = 14;
user_profile_back_angle = 16;
user_profile_left_angle = 11;
user_profile_right_angle = 9;
user_bottom_corner_radius = 2.2;
user_top_corner_radius = 3.6;
user_top_shape_type = "spherical";
user_dish_radius = 36;
user_dish_depth = 1.2;
user_top_pitch_deg = 3;
user_top_roll_deg = -2;

user_legend_enabled = false;
user_homing_bar_enabled = false;

user_stem_type = "mx";
user_stem_outer_delta = 0;
user_stem_cross_margin = 0;
user_stem_inset_delta = 0;

include <../base/keycap.scad>
