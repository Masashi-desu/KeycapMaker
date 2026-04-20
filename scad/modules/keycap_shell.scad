function keycap_quality_steps(quality, preview_steps, export_steps) =
    quality == "preview" ? preview_steps : export_steps;

function keycap_inner_height(top_center_height, dish_depth, top_thickness) =
    max(top_center_height - dish_depth - top_thickness, 0.2);

function keycap_center_surface_z(top_center_height, dish_depth) =
    top_center_height - dish_depth;

function keycap_inner_corner_radius(corner_radius, wall) =
    max(corner_radius - wall, 0.1);

function keycap_top_plane_slope(angle) = tan(angle);

function keycap_top_plane_height(x, y, top_center_height, pitch_deg = 0, roll_deg = 0) =
    top_center_height
    + x * keycap_top_plane_slope(roll_deg)
    + y * keycap_top_plane_slope(pitch_deg);

function keycap_surface_z(x, y, top_center_height, dish_depth, dish_radius, pitch_deg = 0, roll_deg = 0) =
    let(
        plane_z = keycap_top_plane_height(x, y, top_center_height, pitch_deg, roll_deg),
        safe_dish_depth = max(dish_depth, 0),
        safe_dish_radius = max(dish_radius, 0.1),
        radial_sq = x * x + y * y,
        radius_sq = safe_dish_radius * safe_dish_radius,
        dish_z = top_center_height + safe_dish_radius - safe_dish_depth - sqrt(max(radius_sq - radial_sq, 0))
    )
    safe_dish_depth <= 0 || radial_sq >= radius_sq ? plane_z : min(plane_z, dish_z);

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

module keycap_top_plane_transform(top_center_height, pitch_deg = 0, roll_deg = 0) {
    multmatrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [keycap_top_plane_slope(roll_deg), keycap_top_plane_slope(pitch_deg), 1, top_center_height],
        [0, 0, 0, 1]
    ])
        children();
}

module keycap_base_face(left, right, front, back, radius, quality = "export") {
    linear_extrude(height = 0.01, center = true)
        rounded_rect_coords(left, right, front, back, radius, quality);
}

module keycap_top_face(
    left,
    right,
    front,
    back,
    radius,
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg)
        linear_extrude(height = 0.01, center = true)
            rounded_rect_coords(left, right, front, back, radius, quality);
}

module keycap_outer_shell(
    width,
    depth,
    top_center_height,
    front_angle,
    back_angle,
    left_angle,
    right_angle,
    bottom_corner_radius,
    top_corner_radius,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    base_left = -width / 2;
    base_right = width / 2;
    base_front = -depth / 2;
    base_back = depth / 2;

    top_left = base_left + top_center_height * tan(left_angle);
    top_right = base_right - top_center_height * tan(right_angle);
    top_front = base_front + top_center_height * tan(front_angle);
    top_back = base_back - top_center_height * tan(back_angle);

    hull() {
        keycap_base_face(
            base_left,
            base_right,
            base_front,
            base_back,
            bottom_corner_radius,
            quality
        );

        keycap_top_face(
            top_left,
            top_right,
            top_front,
            top_back,
            top_corner_radius,
            top_center_height,
            pitch_deg,
            roll_deg,
            quality
        );
    }
}

module keycap_inner_clearance_volume(
    width,
    depth,
    top_center_height,
    wall,
    top_thickness,
    dish_depth,
    front_angle,
    back_angle,
    left_angle,
    right_angle,
    bottom_corner_radius,
    top_corner_radius,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
    ) {
    inner_height = keycap_inner_height(top_center_height, dish_depth, top_thickness);

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
            keycap_base_face(
                base_left,
                base_right,
                base_front,
                base_back,
                keycap_inner_corner_radius(bottom_corner_radius, wall),
                quality
            );

        keycap_top_face(
            top_left,
            top_right,
            top_front,
            top_back,
            keycap_inner_corner_radius(top_corner_radius, wall),
            inner_height,
            pitch_deg,
            roll_deg,
            quality
        );
    }
}

module keycap_inner_hollow(
    width,
    depth,
    top_center_height,
    wall,
    top_thickness,
    dish_depth,
    front_angle,
    back_angle,
    left_angle,
    right_angle,
    bottom_corner_radius,
    top_corner_radius,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    keycap_inner_clearance_volume(
        width = width,
        depth = depth,
        top_center_height = top_center_height,
        wall = wall,
        top_thickness = top_thickness,
        dish_depth = dish_depth,
        front_angle = front_angle,
        back_angle = back_angle,
        left_angle = left_angle,
        right_angle = right_angle,
        bottom_corner_radius = bottom_corner_radius,
        top_corner_radius = top_corner_radius,
        pitch_deg = pitch_deg,
        roll_deg = roll_deg,
        quality = quality
    );
}

module keycap_dish_volume(
    top_center_height,
    dish_depth,
    dish_radius,
    quality = "export",
    z_shift = 0
) {
    dish_steps = keycap_quality_steps(quality, 48, 100);
    safe_radius = max(dish_radius, 0.1);

    translate([0, 0, top_center_height + safe_radius - dish_depth + z_shift])
        sphere(r = safe_radius, $fn = dish_steps);
}

module keycap_dish_cut(
    top_center_height,
    dish_depth,
    dish_radius,
    quality = "export"
) {
    if (dish_depth > 0) {
        keycap_dish_volume(
            top_center_height = top_center_height,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            quality = quality
        );
    }
}

module keycap_shell(
    width,
    depth,
    top_center_height,
    wall,
    top_thickness = 1.5,
    front_angle = 15,
    back_angle = 15,
    left_angle = 10,
    right_angle = 10,
    bottom_corner_radius = 1.0,
    top_corner_radius = 1.5,
    dish_radius = 45,
    dish_depth = 1.0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    difference() {
        keycap_outer_shell(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            front_angle = front_angle,
            back_angle = back_angle,
            left_angle = left_angle,
            right_angle = right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );

        keycap_inner_clearance_volume(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            wall = wall,
            top_thickness = top_thickness,
            dish_depth = dish_depth,
            front_angle = front_angle,
            back_angle = back_angle,
            left_angle = left_angle,
            right_angle = right_angle,
            bottom_corner_radius = bottom_corner_radius,
            top_corner_radius = top_corner_radius,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );

        keycap_dish_cut(
            top_center_height = top_center_height,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            quality = quality
        );
    }
}
