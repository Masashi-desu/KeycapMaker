export_target = "preview";

include <common/custom-shell-params.scad>

user_key_width = 18;
user_key_depth = 18;
user_top_center_height = 9.5;
user_top_pitch_deg = 4;
user_top_roll_deg = -3;
user_top_offset_x = 2.0;
user_top_offset_y = -1.5;
user_top_shape_type = "spherical";
user_dish_depth = 0.7;

user_legend_text = "OFF";
user_homing_bar_enabled = true;

include <../base/keycap.scad>
