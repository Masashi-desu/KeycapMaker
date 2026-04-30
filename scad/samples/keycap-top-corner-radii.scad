export_target = "preview";
include <common/custom-shell-params.scad>

user_top_corner_radius = 1.5;
user_top_corner_individual_enabled = true;
// [left_top, right_top, right_bottom, left_bottom]
user_top_corner_radii = [0.4, 2.2, 4.0, 1.2];

include <../base/keycap.scad>
