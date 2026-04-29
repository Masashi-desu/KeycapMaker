function keycap_curve_steps(
    radius,
    quality = "export",
    preview_angle = 10,
    export_angle = 5,
    preview_chord = 0.8,
    export_chord = 0.35,
    minimum_steps = 12,
    preview_max_steps = 48,
    export_max_steps = 96
) =
    let(
        safe_radius = max(radius, 0.01),
        max_angle = quality == "preview" ? preview_angle : export_angle,
        max_chord = quality == "preview" ? preview_chord : export_chord,
        max_steps = quality == "preview" ? preview_max_steps : export_max_steps,
        angle_steps = ceil(360 / max(max_angle, 0.1)),
        chord_steps = ceil(2 * PI * safe_radius / max(max_chord, 0.01))
    )
    min(max(max(angle_steps, chord_steps), minimum_steps), max_steps);

function keycap_inner_height(top_center_height, dish_depth, top_thickness) =
    max(top_center_height - dish_depth - top_thickness, 0.2);

function keycap_center_surface_z(top_center_height, dish_depth) =
    top_center_height - dish_depth;

function keycap_inner_corner_radius(corner_radius, wall) =
    max(corner_radius - wall, 0);

function keycap_top_hat_safe_shoulder_angle(angle) =
    min(max(angle, 5), 85);

function keycap_top_hat_shoulder_outset(height, shoulder_angle) =
    abs(height) / tan(keycap_top_hat_safe_shoulder_angle(shoulder_angle));

function keycap_top_hat_safe_shoulder_radius(radius) =
    radius;

function keycap_top_hat_shoulder_curve_steps(radius, quality = "export") =
    radius <= 0.001
        ? 1
        : min(
            max(
                ceil(radius / (quality == "preview" ? 0.35 : 0.2)),
                quality == "preview" ? 4 : 6
            ),
            quality == "preview" ? 8 : 14
        );

function keycap_top_hat_convex_arc_fraction(t) =
    sqrt(max(0, 1 - pow(1 - t, 2)));

function keycap_top_hat_concave_arc_fraction(t) =
    1 - sqrt(max(0, 1 - pow(t, 2)));

function keycap_top_hat_curve_fraction(t, amount) =
    let(
        safe_amount = min(max(amount, -1), 1),
        curve_amount = abs(safe_amount),
        arc_fraction = safe_amount >= 0
            ? keycap_top_hat_convex_arc_fraction(t)
            : keycap_top_hat_concave_arc_fraction(t)
    )
    (1 - curve_amount) * t + curve_amount * arc_fraction;

function keycap_top_plane_slope(angle) = tan(angle);

function keycap_top_plane_height(x, y, top_center_height, pitch_deg = 0, roll_deg = 0) =
    top_center_height
    + x * keycap_top_plane_slope(roll_deg)
    + y * keycap_top_plane_slope(pitch_deg);

function keycap_dish_is_active(dish_type, dish_depth) =
    dish_type != "flat" && abs(dish_depth) > 0.001;

function keycap_dish_reference_unit() = 18;

function keycap_dish_axis_scale(size) =
    max(size / keycap_dish_reference_unit(), 0.001);

function keycap_dish_scaled_x(x, dish_plan_width = 18) =
    x / keycap_dish_axis_scale(dish_plan_width);

function keycap_dish_scaled_y(y, dish_plan_depth = 18) =
    y / keycap_dish_axis_scale(dish_plan_depth);

function keycap_cylindrical_axis_offset(x, y, dish_plan_width = 18, dish_plan_depth = 18) =
    keycap_dish_scaled_x(x, dish_plan_width);

function keycap_dish_radial_sq(
    x,
    y,
    dish_type = "spherical",
    dish_plan_width = 18,
    dish_plan_depth = 18
) =
    dish_type == "cylindrical"
        ? pow(keycap_cylindrical_axis_offset(x, y, dish_plan_width, dish_plan_depth), 2)
        : pow(keycap_dish_scaled_x(x, dish_plan_width), 2)
            + pow(keycap_dish_scaled_y(y, dish_plan_depth), 2);

function keycap_dish_surface_offset(
    x,
    y,
    dish_type,
    dish_depth,
    dish_radius,
    dish_plan_width = 18,
    dish_plan_depth = 18
) =
    let(
        safe_dish_radius = max(dish_radius, 0.1),
        radial_sq = keycap_dish_radial_sq(x, y, dish_type, dish_plan_width, dish_plan_depth),
        radius_sq = safe_dish_radius * safe_dish_radius,
        surface_offset = dish_depth >= 0
            ? safe_dish_radius - dish_depth - sqrt(max(radius_sq - radial_sq, 0))
            : -dish_depth - safe_dish_radius + sqrt(max(radius_sq - radial_sq, 0))
    )
    !keycap_dish_is_active(dish_type, dish_depth) || radial_sq >= radius_sq
        ? 0
        : dish_depth >= 0
            ? min(0, surface_offset)
            : max(0, surface_offset);

function keycap_surface_z(
    x,
    y,
    top_center_height,
    dish_type,
    dish_depth,
    dish_radius,
    pitch_deg = 0,
    roll_deg = 0,
    dish_plan_width = 18,
    dish_plan_depth = 18
) =
    let(
        plane_z = keycap_top_plane_height(x, y, top_center_height, pitch_deg, roll_deg),
        dish_offset = keycap_dish_surface_offset(
            x,
            y,
            dish_type,
            dish_depth,
            dish_radius,
            dish_plan_width,
            dish_plan_depth
        )
    )
    plane_z + dish_offset;

module rounded_rect_coords(left, right, front, back, radius, quality = "export") {
    width = max(right - left, 0.2);
    depth = max(back - front, 0.2);
    center_x = (left + right) / 2;
    center_y = (front + back) / 2;
    safe_radius = min(max(radius, 0), width / 2, depth / 2);
    circle_epsilon = 0.001;
    corner_steps = keycap_curve_steps(
        safe_radius,
        quality,
        minimum_steps = 18,
        preview_max_steps = 48,
        export_max_steps = 96
    );

    translate([center_x, center_y, 0])
        if (safe_radius <= 0.001) {
            square([width, depth], center = true);
        } else if (width <= 2 * safe_radius + circle_epsilon && depth <= 2 * safe_radius + circle_epsilon) {
            circle(r = min(width, depth) / 2, $fn = corner_steps);
        } else if (width <= 2 * safe_radius + circle_epsilon) {
            hull() {
                translate([0, depth / 2 - safe_radius])
                    circle(r = safe_radius, $fn = corner_steps);
                translate([0, -depth / 2 + safe_radius])
                    circle(r = safe_radius, $fn = corner_steps);
            }
        } else if (depth <= 2 * safe_radius + circle_epsilon) {
            hull() {
                translate([width / 2 - safe_radius, 0])
                    circle(r = safe_radius, $fn = corner_steps);
                translate([-width / 2 + safe_radius, 0])
                    circle(r = safe_radius, $fn = corner_steps);
            }
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

module keycap_top_plane_transform(
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    top_offset_x = 0,
    top_offset_y = 0
) {
    multmatrix([
        [1, 0, 0, top_offset_x],
        [0, 1, 0, top_offset_y],
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
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        linear_extrude(height = 0.01, center = true)
            rounded_rect_coords(left, right, front, back, radius, quality);
}

module keycap_top_prism(
    left,
    right,
    front,
    back,
    radius,
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    height = 1,
    base_z = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        translate([0, 0, base_z])
            linear_extrude(height = max(height, 0.01))
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
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
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
            quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
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
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0,
    bottom_extension = 1
    ) {
    inner_height = keycap_inner_height(top_center_height, dish_depth, top_thickness);
    safe_bottom_extension = max(bottom_extension, 0.01);

    base_left = -width / 2 + wall;
    base_right = width / 2 - wall;
    base_front = -depth / 2 + wall;
    base_back = depth / 2 - wall;

    top_left = base_left + inner_height * tan(left_angle);
    top_right = base_right - inner_height * tan(right_angle);
    top_front = base_front + inner_height * tan(front_angle);
    top_back = base_back - inner_height * tan(back_angle);

    hull() {
        translate([0, 0, -safe_bottom_extension])
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
            quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
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
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
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
        quality = quality,
        top_offset_x = top_offset_x,
        top_offset_y = top_offset_y
    );
}

module keycap_dish_volume(
    width,
    depth,
    top_center_height,
    dish_type,
    dish_depth,
    dish_radius,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    z_shift = 0,
    dish_plan_width = undef,
    dish_plan_depth = undef,
    top_offset_x = 0,
    top_offset_y = 0
) {
    safe_radius = max(dish_radius, 0.1);
    resolved_dish_plan_width = is_undef(dish_plan_width) ? width : dish_plan_width;
    resolved_dish_plan_depth = is_undef(dish_plan_depth) ? depth : dish_plan_depth;
    dish_width_scale = keycap_dish_axis_scale(resolved_dish_plan_width);
    dish_depth_scale = keycap_dish_axis_scale(resolved_dish_plan_depth);
    dish_curve_radius = dish_type == "cylindrical"
        ? safe_radius * dish_width_scale
        : safe_radius * max(dish_width_scale, dish_depth_scale);
    dish_center_local_z = dish_depth >= 0
        ? safe_radius - dish_depth + z_shift
        : -safe_radius - dish_depth + z_shift;
    dish_length = sqrt(
        pow(max(width, resolved_dish_plan_width), 2)
        + pow(max(depth, resolved_dish_plan_depth), 2)
    ) + safe_radius * 4 + 4;
    dish_steps = keycap_curve_steps(
        dish_curve_radius,
        quality,
        preview_angle = 8,
        export_angle = 4,
        preview_chord = 2.4,
        export_chord = 1.2,
        minimum_steps = 48,
        preview_max_steps = 64,
        export_max_steps = 128
    );

    // Keep dish curvature in the same local top-plane coordinates as the shell tilt.
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        if (dish_type == "cylindrical") {
            scale([dish_width_scale, 1, 1])
                translate([0, 0, dish_center_local_z])
                    rotate([90, 0, 0])
                        cylinder(h = dish_length, r = safe_radius, center = true, $fn = dish_steps);
        } else if (dish_type == "spherical") {
            scale([dish_width_scale, dish_depth_scale, 1])
                translate([0, 0, dish_center_local_z])
                    sphere(r = safe_radius, $fn = dish_steps);
        }
}

module keycap_dish_cut(
    width,
    depth,
    top_center_height,
    dish_type,
    dish_depth,
    dish_radius,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
    dish_plan_width = undef,
    dish_plan_depth = undef,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    if (keycap_dish_is_active(dish_type, dish_depth) && dish_depth > 0) {
        keycap_dish_volume(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            dish_type = dish_type,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            z_shift = surface_z_shift,
            dish_plan_width = dish_plan_width,
            dish_plan_depth = dish_plan_depth,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
    }
}

module keycap_dish_bump(
    width,
    depth,
    top_left,
    top_right,
    top_front,
    top_back,
    top_radius,
    top_center_height,
    dish_type,
    dish_depth,
    dish_radius,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
    dish_plan_width = undef,
    dish_plan_depth = undef,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    if (keycap_dish_is_active(dish_type, dish_depth) && dish_depth < 0) {
        bump_clip_height = max(abs(dish_depth) + max(dish_radius, 0.1) + 2, 2);

        intersection() {
            keycap_dish_volume(
                width = width,
                depth = depth,
                top_center_height = top_center_height,
                dish_type = dish_type,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                z_shift = surface_z_shift,
                dish_plan_width = dish_plan_width,
                dish_plan_depth = dish_plan_depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );

            keycap_top_prism(
                left = top_left,
                right = top_right,
                front = top_front,
                back = top_back,
                radius = top_radius,
                top_center_height = top_center_height,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                height = bump_clip_height,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_apply_top_surface(
    width,
    depth,
    top_left,
    top_right,
    top_front,
    top_back,
    top_radius,
    top_center_height,
    dish_type = "spherical",
    dish_depth = 0,
    dish_radius = 45,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
    dish_plan_width = undef,
    dish_plan_depth = undef,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    if (!keycap_dish_is_active(dish_type, dish_depth)) {
        children();
    } else if (dish_depth > 0) {
        difference() {
            children();
            keycap_dish_cut(
                width = width,
                depth = depth,
                top_center_height = top_center_height,
                dish_type = dish_type,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                surface_z_shift = surface_z_shift,
                dish_plan_width = dish_plan_width,
                dish_plan_depth = dish_plan_depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    } else {
        union() {
            children();
            keycap_dish_bump(
                width = width,
                depth = depth,
                top_left = top_left,
                top_right = top_right,
                top_front = top_front,
                top_back = top_back,
                top_radius = top_radius,
                top_center_height = top_center_height,
                dish_type = dish_type,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                surface_z_shift = surface_z_shift,
                dish_plan_width = dish_plan_width,
                dish_plan_depth = dish_plan_depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_top_surface_region(
    left,
    right,
    front,
    back,
    radius,
    top_center_height,
    dish_type = "spherical",
    dish_depth = 0,
    dish_radius = 45,
    pitch_deg = 0,
    roll_deg = 0,
    base_z = 0,
    top_extra_z = 0,
    dish_plan_width = undef,
    dish_plan_depth = undef,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    region_width = max(right - left, 0.1);
    region_depth = max(back - front, 0.1);
    region_height = max(top_extra_z - base_z, 0.01);

    keycap_apply_top_surface(
        width = region_width,
        depth = region_depth,
        top_left = left,
        top_right = right,
        top_front = front,
        top_back = back,
        top_radius = radius,
        top_center_height = top_center_height,
        dish_type = dish_type,
        dish_depth = dish_depth,
        dish_radius = dish_radius,
        pitch_deg = pitch_deg,
        roll_deg = roll_deg,
        surface_z_shift = top_extra_z,
        dish_plan_width = dish_plan_width,
        dish_plan_depth = dish_plan_depth,
        quality = quality,
        top_offset_x = top_offset_x,
        top_offset_y = top_offset_y
    )
        keycap_top_prism(
            left = left,
            right = right,
            front = front,
            back = back,
            radius = radius,
            top_center_height = top_center_height,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            height = region_height,
            base_z = base_z,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
}

module keycap_top_hat_section(
    width,
    depth,
    radius,
    z,
    quality = "export"
) {
    translate([0, 0, z])
        linear_extrude(height = 0.01, center = true)
            rounded_rect_coords(
                -width / 2,
                width / 2,
                -depth / 2,
                depth / 2,
                radius,
                quality
            );
}

module keycap_top_hat_cap(
    parent_top_width,
    parent_top_depth,
    top_width,
    top_depth,
    top_radius,
    height,
    shoulder_angle,
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
    shoulder_radius = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    parent_width = max(parent_top_width, 0.2);
    parent_depth = max(parent_top_depth, 0.2);
    safe_top_width = min(max(top_width, 0.2), parent_width);
    safe_top_depth = min(max(top_depth, 0.2), parent_depth);
    safe_height = abs(height);
    requested_outset = keycap_top_hat_shoulder_outset(safe_height, shoulder_angle);
    base_width = min(safe_top_width + requested_outset * 2, parent_width);
    base_depth = min(safe_top_depth + requested_outset * 2, parent_depth);
    actual_outset = min((base_width - safe_top_width) / 2, (base_depth - safe_top_depth) / 2);
    safe_top_radius = min(max(top_radius, 0), safe_top_width / 2, safe_top_depth / 2);
    base_radius = min(safe_top_radius + max(actual_outset, 0), base_width / 2, base_depth / 2);
    safe_shoulder_radius = abs(keycap_top_hat_safe_shoulder_radius(shoulder_radius));
    shoulder_radius_limit = max(min(safe_height, actual_outset), 0);
    shoulder_curve_amount = shoulder_radius_limit <= 0.001
        ? 0
        : min(safe_shoulder_radius / shoulder_radius_limit, 1) * (shoulder_radius < 0 ? -1 : 1);
    shoulder_steps = keycap_top_hat_shoulder_curve_steps(safe_shoulder_radius, quality);
    join_overlap = 0.05;
    base_z = height < 0 ? join_overlap : -join_overlap;
    top_z = height < 0 ? -safe_height : safe_height;

    if (safe_height > 0.001) {
        keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
            translate([0, 0, surface_z_shift])
                if (abs(shoulder_curve_amount) <= 0.001) {
                    hull() {
                        keycap_top_hat_section(
                            width = base_width,
                            depth = base_depth,
                            radius = base_radius,
                            z = base_z,
                            quality = quality
                        );
                        keycap_top_hat_section(
                            width = safe_top_width,
                            depth = safe_top_depth,
                            radius = safe_top_radius,
                            z = top_z,
                            quality = quality
                        );
                    }
                } else {
                    for (step = [0 : shoulder_steps - 1]) {
                        hull() {
                            for (j = [step : step + 1]) {
                                t = j / shoulder_steps;
                                z_fraction = keycap_top_hat_curve_fraction(t, shoulder_curve_amount);
                                keycap_top_hat_section(
                                    width = base_width + (safe_top_width - base_width) * t,
                                    depth = base_depth + (safe_top_depth - base_depth) * t,
                                    radius = base_radius + (safe_top_radius - base_radius) * t,
                                    z = base_z + (top_z - base_z) * z_fraction,
                                    quality = quality
                                );
                            }
                        }
                    }
                }
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
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 1.0,
    top_hat_enabled = false,
    top_hat_top_width = 10.5,
    top_hat_top_depth = 9.5,
    top_hat_top_radius = 1.8,
    top_hat_height = 1.4,
    top_hat_shoulder_angle = 45,
    top_hat_shoulder_radius = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    base_left = -width / 2;
    base_right = width / 2;
    base_front = -depth / 2;
    base_back = depth / 2;
    top_left = base_left + top_center_height * tan(left_angle);
    top_right = base_right - top_center_height * tan(right_angle);
    top_front = base_front + top_center_height * tan(front_angle);
    top_back = base_back - top_center_height * tan(back_angle);

    difference() {
        union() {
            keycap_apply_top_surface(
                width = width,
                depth = depth,
                top_left = top_left,
                top_right = top_right,
                top_front = top_front,
                top_back = top_back,
                top_radius = top_corner_radius,
                top_center_height = top_center_height,
                dish_type = top_shape_type,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            )
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
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );

            if (top_hat_enabled && top_hat_height > 0) {
                keycap_top_hat_cap(
                    parent_top_width = top_right - top_left,
                    parent_top_depth = top_back - top_front,
                    top_width = top_hat_top_width,
                    top_depth = top_hat_top_depth,
                    top_radius = top_hat_top_radius,
                    height = top_hat_height,
                    shoulder_angle = top_hat_shoulder_angle,
                    shoulder_radius = top_hat_shoulder_radius,
                    top_center_height = top_center_height,
                    pitch_deg = pitch_deg,
                    roll_deg = roll_deg,
                    surface_z_shift = keycap_dish_surface_offset(
                        0,
                        0,
                        top_shape_type,
                        dish_depth,
                        dish_radius,
                        width,
                        depth
                    ),
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );
            }
        }

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
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );

        if (top_hat_enabled && top_hat_height < 0) {
            keycap_top_hat_cap(
                parent_top_width = top_right - top_left,
                parent_top_depth = top_back - top_front,
                top_width = top_hat_top_width,
                top_depth = top_hat_top_depth,
                top_radius = top_hat_top_radius,
                height = top_hat_height,
                shoulder_angle = top_hat_shoulder_angle,
                shoulder_radius = top_hat_shoulder_radius,
                top_center_height = top_center_height,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                surface_z_shift = keycap_dish_surface_offset(
                    0,
                    0,
                    top_shape_type,
                    dish_depth,
                    dish_radius,
                    width,
                    depth
                ),
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}
