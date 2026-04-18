function keycap_quality_steps(quality, preview_steps, export_steps) =
    quality == "preview" ? preview_steps : export_steps;

function keycap_outer_height(cap_height, shoulder_height) =
    cap_height + shoulder_height;

function keycap_inner_height(cap_height, dish_depth, top_thickness) =
    max(cap_height - dish_depth - top_thickness, 0.2);

function keycap_center_surface_z(cap_height, dish_depth) =
    cap_height - dish_depth;

function keycap_inner_corner_radius(corner_radius, wall) =
    max(corner_radius - wall, 0.1);

module rounded_rect_coords(left, right, front, back, radius, quality = "export") {
    width = max(right - left, 0.2);
    depth = max(back - front, 0.2);
    center_x = (left + right) / 2;
    center_y = (front + back) / 2;
    safe_radius = max(radius, 0.1);
    corner_steps = keycap_quality_steps(quality, 18, 48);

    translate([center_x, center_y, 0])
        if (width <= 2 * safe_radius || depth <= 2 * safe_radius) {
            square([width, depth], center = true);
        } else {
            hull() {
                translate([ width / 2 - safe_radius,  depth / 2 - safe_radius])
                    circle(r = safe_radius, $fn = corner_steps);
                translate([-width / 2 + safe_radius,  depth / 2 - safe_radius])
                    circle(r = safe_radius, $fn = corner_steps);
                translate([ width / 2 - safe_radius, -depth / 2 + safe_radius])
                    circle(r = safe_radius, $fn = corner_steps);
                translate([-width / 2 + safe_radius, -depth / 2 + safe_radius])
                    circle(r = safe_radius, $fn = corner_steps);
            }
        }
}

module keycap_outer_shell(
    width,
    depth,
    cap_height,
    shoulder_height,
    front_angle,
    back_angle,
    left_angle,
    right_angle,
    bottom_corner_radius,
    top_corner_radius,
    quality = "export"
) {
    outer_height = keycap_outer_height(cap_height, shoulder_height);

    base_left = -width / 2;
    base_right = width / 2;
    base_front = -depth / 2;
    base_back = depth / 2;

    top_left = base_left + outer_height * tan(left_angle);
    top_right = base_right - outer_height * tan(right_angle);
    top_front = base_front + outer_height * tan(front_angle);
    top_back = base_back - outer_height * tan(back_angle);

    hull() {
        linear_extrude(height = 0.01)
            rounded_rect_coords(
                base_left,
                base_right,
                base_front,
                base_back,
                bottom_corner_radius,
                quality
            );

        translate([0, 0, outer_height])
            linear_extrude(height = 0.01)
                rounded_rect_coords(
                    top_left,
                    top_right,
                    top_front,
                    top_back,
                    top_corner_radius,
                    quality
                );
    }
}

module keycap_inner_hollow(
    width,
    depth,
    cap_height,
    wall,
    top_thickness,
    dish_depth,
    front_angle,
    back_angle,
    left_angle,
    right_angle,
    bottom_corner_radius,
    top_corner_radius,
    quality = "export"
) {
    inner_height = keycap_inner_height(cap_height, dish_depth, top_thickness);

    base_left = -width / 2 + wall;
    base_right = width / 2 - wall;
    base_front = -depth / 2 + wall;
    base_back = depth / 2 - wall;

    top_left = base_left + inner_height * tan(left_angle);
    top_right = base_right - inner_height * tan(right_angle);
    top_front = base_front + inner_height * tan(front_angle);
    top_back = base_back - inner_height * tan(back_angle);

    hull() {
        translate([0, 0, -1])
            linear_extrude(height = 0.01)
                rounded_rect_coords(
                    base_left,
                    base_right,
                    base_front,
                    base_back,
                    keycap_inner_corner_radius(bottom_corner_radius, wall),
                    quality
                );

        translate([0, 0, inner_height])
            linear_extrude(height = 0.01)
                rounded_rect_coords(
                    top_left,
                    top_right,
                    top_front,
                    top_back,
                    keycap_inner_corner_radius(top_corner_radius, wall),
                    quality
                );
    }
}

module keycap_dish_volume(
    depth,
    cap_height,
    dish_depth,
    dish_radius,
    top_tilt,
    z_shift = 0,
    quality = "export"
) {
    dish_steps = keycap_quality_steps(quality, 48, 100);

    translate([0, 0, cap_height - dish_depth + z_shift])
        rotate([top_tilt, 0, 0])
            translate([0, 0, dish_radius])
                rotate([90, 0, 0])
                    cylinder(r = dish_radius, h = depth * 3, center = true, $fn = dish_steps);
}

module keycap_dish_cut(
    depth,
    cap_height,
    dish_depth,
    dish_radius,
    top_tilt,
    quality = "export"
) {
    keycap_dish_volume(
        depth = depth,
        cap_height = cap_height,
        dish_depth = dish_depth,
        dish_radius = dish_radius,
        top_tilt = top_tilt,
        quality = quality
    );
}

module keycap_dish_band(
    depth,
    cap_height,
    dish_depth,
    dish_radius,
    top_tilt,
    below_surface = 0.15,
    above_surface = 0,
    quality = "export"
) {
    safe_below_surface = max(below_surface, 0);
    safe_above_surface = max(above_surface, 0);

    if (safe_below_surface + safe_above_surface > 0) {
        difference() {
            keycap_dish_volume(
                depth = depth,
                cap_height = cap_height,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                top_tilt = top_tilt,
                z_shift = -safe_below_surface,
                quality = quality
            );

            keycap_dish_volume(
                depth = depth,
                cap_height = cap_height,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                top_tilt = top_tilt,
                z_shift = safe_above_surface,
                quality = quality
            );
        }
    }
}

module keycap_shell(
    width,
    depth,
    cap_height,
    wall,
    top_thickness = 1.5,
    shoulder_height = 3.0,
    front_angle = 15,
    back_angle = 15,
    left_angle = 10,
    right_angle = 10,
    bottom_corner_radius = 1.0,
    top_corner_radius = 1.5,
    dish_radius = 45,
    dish_depth = 1.0,
    top_tilt = 4,
    quality = "export"
) {
    difference() {
        keycap_outer_shell(
            width = width,
            depth = depth,
            cap_height = cap_height,
            shoulder_height = shoulder_height,
            front_angle = front_angle,
            back_angle = back_angle,
            left_angle = left_angle,
            right_angle = right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            quality = quality
        );

        keycap_inner_hollow(
            width = width,
            depth = depth,
            cap_height = cap_height,
            wall = wall,
            top_thickness = top_thickness,
            dish_depth = dish_depth,
            front_angle = front_angle,
            back_angle = back_angle,
            left_angle = left_angle,
            right_angle = right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            quality = quality
        );

        keycap_dish_cut(
            depth = depth,
            cap_height = cap_height,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            top_tilt = top_tilt,
            quality = quality
        );

        translate([0, 0, cap_height + 20])
            cube([width * 4, depth * 4, 40], center = true);
    }
}
