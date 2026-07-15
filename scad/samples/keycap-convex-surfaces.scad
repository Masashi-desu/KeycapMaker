use <../modules/keycap_shell.scad>
use <../modules/keycap_jis_enter.scad>

module convex_shell(
    x,
    y,
    width = 18,
    depth = 18,
    top_shape_type = "spherical",
    dish_depth = -0.8,
    edge_radius = 0
) {
    translate([x, y, 0])
        keycap_shell(
            width = width,
            depth = depth,
            top_center_height = 9.5,
            wall = 1.2,
            top_thickness = 1.5,
            front_angle = 13,
            back_angle = 13,
            left_angle = 13,
            right_angle = 13,
            bottom_corner_radius = 1,
            top_corner_radius = 1.5,
            top_shape_type = top_shape_type,
            dish_radius = 45,
            dish_depth = dish_depth,
            keycap_edge_radius = edge_radius,
            quality = "export"
        );
}

convex_shell(-30, 14, top_shape_type = "cylindrical", dish_depth = -1.5);
convex_shell(0, 14, top_shape_type = "spherical", dish_depth = -1.5);
convex_shell(30, 14, top_shape_type = "spherical", dish_depth = -1.5, edge_radius = 1);
convex_shell(-10, -16, width = 36, top_shape_type = "cylindrical", dish_depth = -1.5);

translate([28, -18, 0])
    keycap_jis_enter_shell(
        width = 27,
        depth = 36,
        top_center_height = 9.5,
        notch_width = 4.5,
        notch_depth = 18,
        wall = 1.2,
        top_thickness = 1.5,
        front_angle = 8,
        back_angle = 8,
        left_angle = 8,
        right_angle = 8,
        bottom_corner_radius = 1,
        top_corner_radius = 1.5,
        top_shape_type = "spherical",
        dish_radius = 45,
        dish_depth = -1.5,
        keycap_edge_radius = 0.8,
        quality = "export"
    );
