export_target = "preview";

include <common/typewriter-params.scad>

user_shape_geometry_type = "typewriter";
user_key_width = 18;
user_key_depth = 18;
user_top_center_height = 5.2;
user_top_shape_type = "spherical";
user_dish_depth = 0.8;
user_top_pitch_deg = 0;
user_top_roll_deg = 0;
user_rim_enabled = true;
user_rim_width = 1.0;
user_rim_height_up = 0.5;
user_rim_height_down = 0.5;

user_legend_enabled = true;
user_homing_bar_enabled = false;

include <../base/keycap.scad>
