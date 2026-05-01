export_target = "preview";
include <common/jis-enter-params.scad>

user_top_hat_enabled = true;
user_top_hat_inset = 2.0;
user_top_hat_top_radius = 1.5;
user_top_hat_bottom_radius = 0.8;
user_top_hat_bottom_radius_individual_enabled = true;
// [left_top, right_top, right_bottom, left_bottom]
user_top_hat_bottom_radii = [0.4, 1.2, 0.8, 1.6];
user_top_hat_height = 1.4;
user_top_hat_shoulder_angle = 45;
user_top_hat_shoulder_radius = 0.4;

include <../base/keycap.scad>
