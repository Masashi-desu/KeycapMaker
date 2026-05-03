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

function keycap_corner_radius_list(radius) =
    [radius, radius, radius, radius];

function keycap_resolved_corner_radii(radius, corner_radii = undef) =
    let(default_radii = keycap_corner_radius_list(radius))
    is_undef(corner_radii)
        ? default_radii
        : [for (index = [0 : 3]) max(is_undef(corner_radii[index]) ? default_radii[index] : corner_radii[index], 0)];

function keycap_inner_corner_radii(corner_radii, wall) =
    [for (radius = corner_radii) keycap_inner_corner_radius(radius, wall)];

function keycap_corner_radii_add(corner_radii, amount) =
    is_undef(corner_radii)
        ? undef
        : [for (radius = corner_radii) max(radius + amount, 0)];

function keycap_corner_radii_lerp(from_radii, to_radii, t) =
    is_undef(from_radii) || is_undef(to_radii)
        ? undef
        : [for (index = [0 : 3]) from_radii[index] + (to_radii[index] - from_radii[index]) * t];

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

function keycap_top_edge_curve_steps(radius, quality = "export") =
    radius <= 0.001
        ? 1
        : min(
            max(
                ceil(radius / (quality == "preview" ? 0.25 : 0.15)),
                quality == "preview" ? 4 : 6
            ),
            quality == "preview" ? 10 : 18
        );

function keycap_top_edge_slope(top_center_height, shoulder_outset) =
    max(shoulder_outset, 0) / max(top_center_height, 0.001);

function keycap_top_edge_top_inset(radius, top_center_height, shoulder_outset) =
    let(
        safe_radius = max(radius, 0),
        side_slope = keycap_top_edge_slope(top_center_height, shoulder_outset)
    )
    safe_radius * (sqrt(1 + pow(side_slope, 2)) - side_slope);

function keycap_top_edge_side_drop(radius, top_center_height, shoulder_outset) =
    let(
        safe_radius = max(radius, 0),
        safe_outset = max(shoulder_outset, 0),
        side_slope = keycap_top_edge_slope(top_center_height, shoulder_outset)
    )
    safe_outset <= 0.001
        ? 0
        : safe_radius * (1 - side_slope / sqrt(1 + pow(side_slope, 2)));

function keycap_top_edge_arc_unit(side_slope, u) =
    let(
        safe_u = min(max(u, 0), 1),
        base = sqrt(1 + pow(side_slope, 2)),
        x = -(1 - safe_u) / base,
        z = -((1 - safe_u) * side_slope / base + safe_u),
        length = max(sqrt(pow(x, 2) + pow(z, 2)), 0.001)
    )
    [x / length, z / length];

function keycap_top_edge_arc_local_inset(radius, top_center_height, shoulder_outset, u) =
    let(
        side_slope = keycap_top_edge_slope(top_center_height, shoulder_outset),
        unit = keycap_top_edge_arc_unit(side_slope, u)
    )
    keycap_top_edge_top_inset(radius, top_center_height, shoulder_outset) + max(radius, 0) * unit[0];

function keycap_top_edge_arc_drop(radius, top_center_height, shoulder_outset, u) =
    let(
        side_slope = keycap_top_edge_slope(top_center_height, shoulder_outset),
        unit = keycap_top_edge_arc_unit(side_slope, u)
    )
    max(radius, 0) + max(radius, 0) * unit[1];

function keycap_top_edge_arc_plan_fraction(radius, top_center_height, shoulder_outset, u) =
    let(
        start_inset = keycap_top_edge_arc_local_inset(radius, top_center_height, shoulder_outset, 0),
        end_inset = keycap_top_edge_top_inset(radius, top_center_height, shoulder_outset),
        inset = keycap_top_edge_arc_local_inset(radius, top_center_height, shoulder_outset, u)
    )
    end_inset - start_inset <= 0.001
        ? min(max(u, 0), 1)
        : min(max((inset - start_inset) / (end_inset - start_inset), 0), 1);

function keycap_top_edge_arc_lift_fraction(radius, top_center_height, shoulder_outset, u) =
    let(
        start_drop = keycap_top_edge_side_drop(radius, top_center_height, shoulder_outset),
        drop = keycap_top_edge_arc_drop(radius, top_center_height, shoulder_outset, u)
    )
    start_drop <= 0.001
        ? min(max(u, 0), 1)
        : min(max(1 - drop / start_drop, 0), 1);

function keycap_shell_shoulder_z_fraction(t, shoulder_curve_amount) =
    abs(shoulder_curve_amount) <= 0.001
        ? t
        : keycap_top_hat_curve_fraction(t, shoulder_curve_amount);

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

function keycap_dish_max_drop(dish_type, dish_depth) =
    keycap_dish_is_active(dish_type, dish_depth) && dish_depth > 0
        ? dish_depth
        : 0;

function keycap_dish_sag_at_distance(distance, dish_radius) =
    let(
        safe_dish_radius = max(dish_radius, 0.1),
        safe_distance = min(max(distance, 0), safe_dish_radius)
    )
    safe_dish_radius - sqrt(max(pow(safe_dish_radius, 2) - pow(safe_distance, 2), 0));

function keycap_dish_depth_limit(dish_type, dish_radius, top_left, top_right, top_front, top_back) =
    dish_type == "flat"
        ? 0
        : let(
            x_radius = max(abs(top_left), abs(top_right)),
            y_radius = max(abs(top_front), abs(top_back)),
            dish_distance = dish_type == "cylindrical"
                ? x_radius
                : sqrt(pow(x_radius, 2) + pow(y_radius, 2))
        )
        keycap_dish_sag_at_distance(dish_distance, dish_radius);

function keycap_clamp_dish_depth(dish_type, dish_depth, dish_radius, top_left, top_right, top_front, top_back) =
    min(
        max(dish_depth, 0),
        keycap_dish_depth_limit(dish_type, dish_radius, top_left, top_right, top_front, top_back)
    );

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

function rounded_rect_corner_scale(size, radius_a, radius_b) =
    radius_a + radius_b > 0.001 ? size / (radius_a + radius_b) : 1;

function rounded_rect_safe_corner_radii(width, depth, corner_radii) =
    let(
        left_top = max(corner_radii[0], 0),
        right_top = max(corner_radii[1], 0),
        right_bottom = max(corner_radii[2], 0),
        left_bottom = max(corner_radii[3], 0),
        scale = min(
            1,
            rounded_rect_corner_scale(width, left_top, right_top),
            rounded_rect_corner_scale(width, left_bottom, right_bottom),
            rounded_rect_corner_scale(depth, left_top, left_bottom),
            rounded_rect_corner_scale(depth, right_top, right_bottom)
        )
    )
    [left_top * scale, right_top * scale, right_bottom * scale, left_bottom * scale];

function rounded_rect_corner_arc_steps(radius, quality = "export") =
    radius <= 0.001
        ? 1
        : max(
            ceil(keycap_curve_steps(
                radius,
                quality,
                minimum_steps = 18,
                preview_max_steps = 48,
                export_max_steps = 96
            ) / 4),
            2
        );

function rounded_rect_corner_arc_points(cx, cy, radius, start_angle, end_angle, steps, fallback) =
    radius <= 0.001
        ? [fallback]
        : [
            for (index = [0 : steps])
                let(angle = start_angle + (end_angle - start_angle) * index / max(steps, 1))
                [cx + radius * cos(angle), cy + radius * sin(angle)]
        ];

// corner_radii order: [left_top, right_top, right_bottom, left_bottom].
module rounded_rect_coords_with_corner_radii(left, right, front, back, corner_radii, quality = "export") {
    width = max(right - left, 0.2);
    depth = max(back - front, 0.2);
    safe_radii = rounded_rect_safe_corner_radii(width, depth, keycap_resolved_corner_radii(0, corner_radii));
    left_top_radius = safe_radii[0];
    right_top_radius = safe_radii[1];
    right_bottom_radius = safe_radii[2];
    left_bottom_radius = safe_radii[3];

    polygon(points = concat(
        rounded_rect_corner_arc_points(
            right - right_bottom_radius,
            front + right_bottom_radius,
            right_bottom_radius,
            -90,
            0,
            rounded_rect_corner_arc_steps(right_bottom_radius, quality),
            [right, front]
        ),
        rounded_rect_corner_arc_points(
            right - right_top_radius,
            back - right_top_radius,
            right_top_radius,
            0,
            90,
            rounded_rect_corner_arc_steps(right_top_radius, quality),
            [right, back]
        ),
        rounded_rect_corner_arc_points(
            left + left_top_radius,
            back - left_top_radius,
            left_top_radius,
            90,
            180,
            rounded_rect_corner_arc_steps(left_top_radius, quality),
            [left, back]
        ),
        rounded_rect_corner_arc_points(
            left + left_bottom_radius,
            front + left_bottom_radius,
            left_bottom_radius,
            180,
            270,
            rounded_rect_corner_arc_steps(left_bottom_radius, quality),
            [left, front]
        )
    ));
}

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
    top_offset_y = 0,
    corner_radii = undef
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        linear_extrude(height = 0.01, center = true)
            if (is_undef(corner_radii)) {
                rounded_rect_coords(left, right, front, back, radius, quality);
            } else {
                rounded_rect_coords_with_corner_radii(left, right, front, back, corner_radii, quality);
            }
}

module keycap_shell_section_face(
    left,
    right,
    front,
    back,
    radius,
    z,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0,
    tilt_amount = 0,
    corner_radii = undef
) {
    multmatrix([
        [1, 0, 0, top_offset_x],
        [0, 1, 0, top_offset_y],
        [
            keycap_top_plane_slope(roll_deg) * tilt_amount,
            keycap_top_plane_slope(pitch_deg) * tilt_amount,
            1,
            z
        ],
        [0, 0, 0, 1]
    ])
        linear_extrude(height = 0.01, center = true)
            if (is_undef(corner_radii)) {
                rounded_rect_coords(left, right, front, back, radius, quality);
            } else {
                rounded_rect_coords_with_corner_radii(left, right, front, back, corner_radii, quality);
            }
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
    top_offset_y = 0,
    corner_radii = undef
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        translate([0, 0, base_z])
            linear_extrude(height = max(height, 0.01))
                if (is_undef(corner_radii)) {
                    rounded_rect_coords(left, right, front, back, radius, quality);
                } else {
                    rounded_rect_coords_with_corner_radii(left, right, front, back, corner_radii, quality);
                }
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
    top_offset_y = 0,
    top_corner_radii = undef,
    shoulder_radius = 0,
    top_edge_radius = 0
) {
    base_left = -width / 2;
    base_right = width / 2;
    base_front = -depth / 2;
    base_back = depth / 2;

    top_left = base_left + top_center_height * tan(left_angle);
    top_right = base_right - top_center_height * tan(right_angle);
    top_front = base_front + top_center_height * tan(front_angle);
    top_back = base_back - top_center_height * tan(back_angle);
    shoulder_outset = max(min(
        max(top_left - base_left, 0),
        max(base_right - top_right, 0),
        max(top_front - base_front, 0),
        max(base_back - top_back, 0)
    ), 0);
    safe_shoulder_radius = abs(keycap_top_hat_safe_shoulder_radius(shoulder_radius));
    shoulder_radius_limit = max(min(top_center_height, shoulder_outset), 0);
    shoulder_curve_amount = shoulder_radius_limit <= 0.001
        ? 0
        : min(safe_shoulder_radius / shoulder_radius_limit, 1) * (shoulder_radius < 0 ? -1 : 1);
    shoulder_steps = keycap_top_hat_shoulder_curve_steps(safe_shoulder_radius, quality);
    top_width = max(top_right - top_left, 0.2);
    top_depth = max(top_back - top_front, 0.2);
    top_edge_inset_limit = max(min((top_width - 0.2) / 2, (top_depth - 0.2) / 2), 0);
    top_edge_radius_limit = max(min(top_center_height, shoulder_outset), 0);
    top_edge_unit_inset = keycap_top_edge_top_inset(1, top_center_height, shoulder_outset);
    effective_top_edge_radius = min(
        max(top_edge_radius, 0),
        top_edge_radius_limit,
        top_edge_unit_inset <= 0.001 ? 0 : top_edge_inset_limit / top_edge_unit_inset
    );
    top_edge_side_drop = keycap_top_edge_side_drop(effective_top_edge_radius, top_center_height, shoulder_outset);
    top_edge_top_inset = keycap_top_edge_top_inset(effective_top_edge_radius, top_center_height, shoulder_outset);
    top_edge_start = top_edge_side_drop <= 0.001
        ? 1
        : max(1 - top_edge_side_drop / max(top_center_height, 0.001), 0);
    top_edge_steps = keycap_top_edge_curve_steps(effective_top_edge_radius, quality);
    has_top_edge_curve = effective_top_edge_radius > 0.001
        && top_edge_side_drop > 0.001
        && top_edge_top_inset > 0.001;
    has_corner_radii = !is_undef(top_corner_radii);
    base_corner_radii = has_corner_radii
        ? keycap_corner_radius_list(bottom_corner_radius)
        : undef;

    if (abs(shoulder_curve_amount) <= 0.001 && !has_top_edge_curve) {
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
                top_offset_y = top_offset_y,
                corner_radii = top_corner_radii
            );
        }
    } else if (!has_top_edge_curve) {
        for (step = [0 : shoulder_steps - 1]) {
            hull() {
                for (j = [step : step + 1]) {
                    t = j / shoulder_steps;
                    z_fraction = keycap_shell_shoulder_z_fraction(t, shoulder_curve_amount);
                    keycap_shell_section_face(
                        left = base_left + (top_left - base_left) * t,
                        right = base_right + (top_right - base_right) * t,
                        front = base_front + (top_front - base_front) * t,
                        back = base_back + (top_back - base_back) * t,
                        radius = bottom_corner_radius + (top_corner_radius - bottom_corner_radius) * t,
                        z = top_center_height * z_fraction,
                        pitch_deg = pitch_deg,
                        roll_deg = roll_deg,
                        quality = quality,
                        top_offset_x = top_offset_x * t,
                        top_offset_y = top_offset_y * t,
                        tilt_amount = z_fraction,
                        corner_radii = keycap_corner_radii_lerp(base_corner_radii, top_corner_radii, t)
                    );
                }
            }
        }
    } else {
        lower_steps = abs(shoulder_curve_amount) <= 0.001 ? 1 : shoulder_steps;
        start_z_fraction = keycap_shell_shoulder_z_fraction(top_edge_start, shoulder_curve_amount);
        start_left = base_left + (top_left - base_left) * top_edge_start;
        start_right = base_right + (top_right - base_right) * top_edge_start;
        start_front = base_front + (top_front - base_front) * top_edge_start;
        start_back = base_back + (top_back - base_back) * top_edge_start;
        start_radius = bottom_corner_radius + (top_corner_radius - bottom_corner_radius) * top_edge_start;
        start_corner_radii = keycap_corner_radii_lerp(base_corner_radii, top_corner_radii, top_edge_start);
        edge_top_left = top_left + top_edge_top_inset;
        edge_top_right = top_right - top_edge_top_inset;
        edge_top_front = top_front + top_edge_top_inset;
        edge_top_back = top_back - top_edge_top_inset;
        edge_top_radius = max(top_corner_radius - top_edge_top_inset, 0);
        edge_top_corner_radii = keycap_corner_radii_add(top_corner_radii, -top_edge_top_inset);

        if (top_edge_start > 0.001) {
            for (step = [0 : lower_steps - 1]) {
                hull() {
                    for (j = [step : step + 1]) {
                        t = top_edge_start * j / lower_steps;
                        z_fraction = keycap_shell_shoulder_z_fraction(t, shoulder_curve_amount);
                        keycap_shell_section_face(
                            left = base_left + (top_left - base_left) * t,
                            right = base_right + (top_right - base_right) * t,
                            front = base_front + (top_front - base_front) * t,
                            back = base_back + (top_back - base_back) * t,
                            radius = bottom_corner_radius + (top_corner_radius - bottom_corner_radius) * t,
                            z = top_center_height * z_fraction,
                            pitch_deg = pitch_deg,
                            roll_deg = roll_deg,
                            quality = quality,
                            top_offset_x = top_offset_x * t,
                            top_offset_y = top_offset_y * t,
                            tilt_amount = z_fraction,
                            corner_radii = keycap_corner_radii_lerp(base_corner_radii, top_corner_radii, t)
                        );
                    }
                }
            }
        }

        for (step = [0 : top_edge_steps - 1]) {
            hull() {
                for (j = [step : step + 1]) {
                    u = j / top_edge_steps;
                    plan_fraction = keycap_top_edge_arc_plan_fraction(
                        effective_top_edge_radius,
                        top_center_height,
                        shoulder_outset,
                        u
                    );
                    lift_fraction = keycap_top_edge_arc_lift_fraction(
                        effective_top_edge_radius,
                        top_center_height,
                        shoulder_outset,
                        u
                    );
                    offset_fraction = top_edge_start + (1 - top_edge_start) * plan_fraction;
                    z_fraction = start_z_fraction + (1 - start_z_fraction) * lift_fraction;
                    keycap_shell_section_face(
                        left = start_left + (edge_top_left - start_left) * plan_fraction,
                        right = start_right + (edge_top_right - start_right) * plan_fraction,
                        front = start_front + (edge_top_front - start_front) * plan_fraction,
                        back = start_back + (edge_top_back - start_back) * plan_fraction,
                        radius = start_radius + (edge_top_radius - start_radius) * plan_fraction,
                        z = top_center_height * z_fraction,
                        pitch_deg = pitch_deg,
                        roll_deg = roll_deg,
                        quality = quality,
                        top_offset_x = top_offset_x * offset_fraction,
                        top_offset_y = top_offset_y * offset_fraction,
                        tilt_amount = z_fraction,
                        corner_radii = keycap_corner_radii_lerp(start_corner_radii, edge_top_corner_radii, plan_fraction)
                    );
                }
            }
        }
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
    bottom_extension = 1,
    top_corner_radii = undef
) {
    inner_height = keycap_inner_height(top_center_height, dish_depth, top_thickness);
    safe_bottom_extension = max(bottom_extension, 0.01);
    inner_top_corner_radii = is_undef(top_corner_radii)
        ? undef
        : keycap_inner_corner_radii(top_corner_radii, wall);

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
            top_offset_y = top_offset_y,
            corner_radii = inner_top_corner_radii
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
    top_offset_y = 0,
    top_corner_radii = undef
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
        top_offset_y = top_offset_y,
        top_corner_radii = top_corner_radii
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
    top_offset_y = 0,
    top_corner_radii = undef
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
    top_offset_y = 0,
    top_corner_radii = undef
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
                top_offset_y = top_offset_y,
                corner_radii = top_corner_radii
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
    top_offset_y = 0,
    top_corner_radii = undef
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
                top_offset_y = top_offset_y,
                top_corner_radii = top_corner_radii
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
    top_offset_y = 0,
    top_corner_radii = undef
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
        top_offset_y = top_offset_y,
        top_corner_radii = top_corner_radii
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
            top_offset_y = top_offset_y,
            corner_radii = top_corner_radii
        );
}

module keycap_top_surface_band(
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
    bottom_extra_z = 0,
    top_extra_z = 0,
    dish_plan_width = undef,
    dish_plan_depth = undef,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0,
    top_corner_radii = undef
) {
    fit_overlap = 0.05;
    lower_extra_z = min(bottom_extra_z, top_extra_z - 0.01);
    deep_base_z = lower_extra_z - keycap_dish_max_drop(dish_type, dish_depth) - fit_overlap;

    difference() {
        keycap_top_surface_region(
            left = left,
            right = right,
            front = front,
            back = back,
            radius = radius,
            top_center_height = top_center_height,
            dish_type = dish_type,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            base_z = deep_base_z,
            top_extra_z = top_extra_z,
            dish_plan_width = dish_plan_width,
            dish_plan_depth = dish_plan_depth,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y,
            top_corner_radii = top_corner_radii
        );

        keycap_top_surface_region(
            left = left,
            right = right,
            front = front,
            back = back,
            radius = radius,
            top_center_height = top_center_height,
            dish_type = dish_type,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            base_z = deep_base_z - fit_overlap,
            top_extra_z = lower_extra_z,
            dish_plan_width = dish_plan_width,
            dish_plan_depth = dish_plan_depth,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y,
            top_corner_radii = top_corner_radii
        );
    }
}

module keycap_top_hat_section(
    width,
    depth,
    radius,
    z,
    quality = "export",
    corner_radii = undef
) {
    translate([0, 0, z])
        linear_extrude(height = 0.01, center = true)
            if (is_undef(corner_radii)) {
                rounded_rect_coords(
                    -width / 2,
                    width / 2,
                    -depth / 2,
                    depth / 2,
                    radius,
                    quality
                );
            } else {
                rounded_rect_coords_with_corner_radii(
                    -width / 2,
                    width / 2,
                    -depth / 2,
                    depth / 2,
                    corner_radii,
                    quality
                );
            }
}

module keycap_top_hat_cap(
    parent_top_width,
    parent_top_depth,
    top_width,
    top_depth,
    top_radius,
    bottom_radius,
    height,
    shoulder_angle,
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
    shoulder_radius = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0,
    top_corner_radii = undef,
    bottom_corner_radii = undef,
    bottom_width = undef,
    bottom_depth = undef
) {
    parent_width = max(parent_top_width, 0.2);
    parent_depth = max(parent_top_depth, 0.2);
    safe_top_width = min(max(top_width, 0.2), parent_width);
    safe_top_depth = min(max(top_depth, 0.2), parent_depth);
    safe_height = abs(height);
    requested_outset = keycap_top_hat_shoulder_outset(safe_height, shoulder_angle);
    automatic_base_width = min(safe_top_width + requested_outset * 2, parent_width);
    automatic_base_depth = min(safe_top_depth + requested_outset * 2, parent_depth);
    base_width = is_undef(bottom_width)
        ? automatic_base_width
        : min(max(bottom_width, safe_top_width), parent_width);
    base_depth = is_undef(bottom_depth)
        ? automatic_base_depth
        : min(max(bottom_depth, safe_top_depth), parent_depth);
    actual_outset = min((base_width - safe_top_width) / 2, (base_depth - safe_top_depth) / 2);
    safe_top_radius = min(max(top_radius, 0), safe_top_width / 2, safe_top_depth / 2);
    has_corner_radii = !is_undef(top_corner_radii) || !is_undef(bottom_corner_radii);
    safe_top_corner_radii = !has_corner_radii
        ? undef
        : rounded_rect_safe_corner_radii(
            safe_top_width,
            safe_top_depth,
            keycap_resolved_corner_radii(safe_top_radius, top_corner_radii)
        );
    base_radius = min(max(bottom_radius, 0), base_width / 2, base_depth / 2);
    base_corner_radii = !has_corner_radii
        ? undef
        : rounded_rect_safe_corner_radii(
            base_width,
            base_depth,
            keycap_resolved_corner_radii(base_radius, bottom_corner_radii)
        );
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
                            quality = quality,
                            corner_radii = base_corner_radii
                        );
                        keycap_top_hat_section(
                            width = safe_top_width,
                            depth = safe_top_depth,
                            radius = safe_top_radius,
                            z = top_z,
                            quality = quality,
                            corner_radii = safe_top_corner_radii
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
                                    quality = quality,
                                    corner_radii = keycap_corner_radii_lerp(base_corner_radii, safe_top_corner_radii, t)
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
    top_hat_bottom_width = undef,
    top_hat_bottom_depth = undef,
    top_hat_top_radius = 1.8,
    top_hat_top_radii = undef,
    top_hat_bottom_radius = 3.2,
    top_hat_bottom_radii = undef,
    top_hat_height = 1.4,
    top_hat_shoulder_angle = 45,
    top_hat_shoulder_radius = 0,
    keycap_shoulder_radius = 0,
    keycap_edge_radius = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0,
    top_corner_radii = undef
) {
    base_left = -width / 2;
    base_right = width / 2;
    base_front = -depth / 2;
    base_back = depth / 2;
    top_left = base_left + top_center_height * tan(left_angle);
    top_right = base_right - top_center_height * tan(right_angle);
    top_front = base_front + top_center_height * tan(front_angle);
    top_back = base_back - top_center_height * tan(back_angle);
    resolved_top_corner_radii = is_undef(top_corner_radii)
        ? undef
        : keycap_resolved_corner_radii(top_corner_radius, top_corner_radii);

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
                top_offset_y = top_offset_y,
                top_corner_radii = resolved_top_corner_radii
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
                    top_offset_y = top_offset_y,
                    top_corner_radii = resolved_top_corner_radii,
                    shoulder_radius = keycap_shoulder_radius,
                    top_edge_radius = keycap_edge_radius
                );

            if (top_hat_enabled && top_hat_height > 0) {
                keycap_top_hat_cap(
                    parent_top_width = top_right - top_left,
                    parent_top_depth = top_back - top_front,
                    top_width = top_hat_top_width,
                    top_depth = top_hat_top_depth,
                    bottom_width = top_hat_bottom_width,
                    bottom_depth = top_hat_bottom_depth,
                    top_radius = top_hat_top_radius,
                    bottom_radius = top_hat_bottom_radius,
                    bottom_corner_radii = top_hat_bottom_radii,
                    top_corner_radii = top_hat_top_radii,
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
            top_offset_y = top_offset_y,
            top_corner_radii = resolved_top_corner_radii
        );

        if (top_hat_enabled && top_hat_height < 0) {
            keycap_top_hat_cap(
                parent_top_width = top_right - top_left,
                parent_top_depth = top_back - top_front,
                top_width = top_hat_top_width,
                top_depth = top_hat_top_depth,
                bottom_width = top_hat_bottom_width,
                bottom_depth = top_hat_bottom_depth,
                top_radius = top_hat_top_radius,
                bottom_radius = top_hat_bottom_radius,
                bottom_corner_radii = top_hat_bottom_radii,
                top_corner_radii = top_hat_top_radii,
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
