export_target = "preview";

include <common/custom-shell-params.scad>

user_key_width = 18;
user_key_depth = 18;
user_top_center_height = 9.5;
user_top_shape_type = "cylindrical";
user_dish_depth = 0.9;
user_top_pitch_deg = 2;
user_top_roll_deg = -1;

user_legend_enabled = false;
user_homing_bar_enabled = false;

include <../base/keycap.scad>
