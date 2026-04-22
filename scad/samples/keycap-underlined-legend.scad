export_target = "legend";

include <common/standard-1u-params.scad>

user_key_width = 18;
user_key_depth = 18;
user_top_center_height = 9.5;
user_top_pitch_deg = 0;
user_top_roll_deg = 0;
user_wall_thickness = 1.2;
user_top_scale = 0.84;
user_dish_radius = 45;
user_dish_depth = 0;

user_legend_enabled = true;
user_legend_text = "A";
user_legend_font_name = "M PLUS 1:style=Regular";
user_legend_underline_enabled = true;
// Derived from MPLUS1-Variable.ttf post/head/hhea metrics and converted to centered text coordinates.
user_legend_underline_width = 5.0;
user_legend_underline_thickness = 0.196;
user_legend_underline_offset_y = -2.19912;
user_legend_width = 7.2;
user_legend_depth = 4.0;
user_legend_height = 0;
user_legend_embed = 0.6;
user_legend_outline_delta = 0;

user_homing_bar_enabled = false;
user_stem_type = "none";
user_stem_enabled = false;

include <../base/keycap.scad>
