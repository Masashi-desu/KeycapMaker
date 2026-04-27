use <keycap_shell.scad>

function jis_enter_safe_notch_width(width, notch_width) =
    min(max(notch_width, 0), max(width - 0.2, 0));
function jis_enter_safe_notch_depth(depth, notch_depth) =
    min(max(notch_depth, 0), max(depth - 0.2, 0));
function jis_enter_plan_left(width, notch_width) =
    -width / 2 - jis_enter_safe_notch_width(width, notch_width) / 2;
function jis_enter_plan_right(width, notch_width) =
    width / 2 - jis_enter_safe_notch_width(width, notch_width) / 2;
function jis_enter_coord_width(left, right) = max(right - left, 0.2);
function jis_enter_coord_depth(front, back) = max(back - front, 0.2);
function jis_enter_coord_notch_width(left, right, notch_width) =
    jis_enter_safe_notch_width(jis_enter_coord_width(left, right), notch_width);
function jis_enter_coord_notch_depth(front, back, notch_depth) =
    jis_enter_safe_notch_depth(jis_enter_coord_depth(front, back), notch_depth);
function jis_enter_has_notch(left, right, front, back, notch_width, notch_depth) =
    jis_enter_coord_notch_width(left, right, notch_width) > 0.001
    && jis_enter_coord_notch_depth(front, back, notch_depth) > 0.001;
function jis_enter_notch_x(left, right, notch_width) =
    left + jis_enter_coord_notch_width(left, right, notch_width);
function jis_enter_notch_y(front, back, notch_depth) =
    front + jis_enter_coord_notch_depth(front, back, notch_depth);
function jis_enter_plan_corner_radius(left, right, front, back, notch_width, notch_depth, radius) =
    let(
        width = jis_enter_coord_width(left, right),
        depth = jis_enter_coord_depth(front, back),
        safe_notch_width = jis_enter_coord_notch_width(left, right, notch_width),
        safe_notch_depth = jis_enter_coord_notch_depth(front, back, notch_depth),
        lower_width = max(width - safe_notch_width, 0.2),
        upper_depth = max(depth - safe_notch_depth, 0.2),
        notch_width_limit = safe_notch_width > 0.001 ? safe_notch_width : width,
        notch_depth_limit = safe_notch_depth > 0.001 ? safe_notch_depth : depth,
        radius_limit = min(width, depth, lower_width, upper_depth, notch_width_limit, notch_depth_limit) / 2
    )
    min(max(radius, 0), max(radius_limit, 0));
function jis_enter_plan_inset_limit(left, right, front, back, notch_width, notch_depth) =
    let(
        width = jis_enter_coord_width(left, right),
        depth = jis_enter_coord_depth(front, back),
        safe_notch_width = jis_enter_coord_notch_width(left, right, notch_width),
        safe_notch_depth = jis_enter_coord_notch_depth(front, back, notch_depth),
        lower_width = width - safe_notch_width,
        upper_depth = depth - safe_notch_depth
    )
    max(min(
        (width - 0.2) / 2,
        (depth - 0.2) / 2,
        (lower_width - 0.2) / 2,
        (upper_depth - 0.2) / 2
    ), 0);
function jis_enter_plan_safe_inset(left, right, front, back, notch_width, notch_depth, inset) =
    min(max(inset, 0), jis_enter_plan_inset_limit(left, right, front, back, notch_width, notch_depth));
function jis_enter_plan_points(left, right, front, back, notch_width, notch_depth) =
    let(
        notch_x = jis_enter_notch_x(left, right, notch_width),
        notch_y = jis_enter_notch_y(front, back, notch_depth)
    )
    jis_enter_has_notch(left, right, front, back, notch_width, notch_depth)
        ? [
            [left, notch_y],
            [left, back],
            [right, back],
            [right, front],
            [notch_x, front],
            [notch_x, notch_y],
        ]
        : [
            [left, front],
            [right, front],
            [right, back],
            [left, back]
        ];

module jis_enter_plan_polygon(left, right, front, back, notch_width, notch_depth) {
    polygon(points = jis_enter_plan_points(left, right, front, back, notch_width, notch_depth));
}

module keycap_jis_enter_plan_profile(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    radius,
    quality = "export"
) {
    safe_radius = jis_enter_plan_corner_radius(left, right, front, back, notch_width, notch_depth, radius);
    corner_steps = keycap_curve_steps(
        safe_radius,
        quality,
        minimum_steps = 18,
        preview_max_steps = 48,
        export_max_steps = 96
    );

    if (safe_radius <= 0.001) {
        jis_enter_plan_polygon(left, right, front, back, notch_width, notch_depth);
    } else {
        offset(r = safe_radius, $fn = corner_steps)
            offset(delta = -safe_radius)
                jis_enter_plan_polygon(left, right, front, back, notch_width, notch_depth);
    }
}

module keycap_jis_enter_face(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    radius,
    quality = "export"
) {
    linear_extrude(height = 0.01, center = true)
        keycap_jis_enter_plan_profile(
            left = left,
            right = right,
            front = front,
            back = back,
            notch_width = notch_width,
            notch_depth = notch_depth,
            radius = radius,
            quality = quality
        );
}

module keycap_jis_enter_top_face(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    radius,
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        keycap_jis_enter_face(
            left = left,
            right = right,
            front = front,
            back = back,
            notch_width = notch_width,
            notch_depth = notch_depth,
            radius = radius,
            quality = quality
        );
}

module keycap_jis_enter_top_prism(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
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
                keycap_jis_enter_plan_profile(
                    left = left,
                    right = right,
                    front = front,
                    back = back,
                    notch_width = notch_width,
                    notch_depth = notch_depth,
                    radius = radius,
                    quality = quality
            );
}

module keycap_jis_enter_selective_rounded_rect(
    left,
    right,
    front,
    back,
    radius,
    round_front_left = true,
    round_front_right = true,
    round_back_right = true,
    round_back_left = true,
    quality = "export"
) {
    width = max(right - left, 0.2);
    depth = max(back - front, 0.2);
    center_x = (left + right) / 2;
    center_y = (front + back) / 2;
    safe_radius = min(max(radius, 0), width / 2, depth / 2);
    rect_epsilon = 0.001;
    corner_steps = keycap_curve_steps(
        safe_radius,
        quality,
        minimum_steps = 18,
        preview_max_steps = 48,
        export_max_steps = 96
    );

    if (safe_radius <= 0.001) {
        translate([center_x, center_y, 0])
            square([width, depth], center = true);
    } else {
        union() {
            translate([center_x, center_y, 0])
                square([max(width - safe_radius * 2, rect_epsilon), depth], center = true);
            translate([center_x, center_y, 0])
                square([width, max(depth - safe_radius * 2, rect_epsilon)], center = true);

            if (round_front_left) {
                translate([left + safe_radius, front + safe_radius, 0])
                    circle(r = safe_radius, $fn = corner_steps);
            } else {
                translate([left + safe_radius / 2, front + safe_radius / 2, 0])
                    square([safe_radius, safe_radius], center = true);
            }

            if (round_front_right) {
                translate([right - safe_radius, front + safe_radius, 0])
                    circle(r = safe_radius, $fn = corner_steps);
            } else {
                translate([right - safe_radius / 2, front + safe_radius / 2, 0])
                    square([safe_radius, safe_radius], center = true);
            }

            if (round_back_right) {
                translate([right - safe_radius, back - safe_radius, 0])
                    circle(r = safe_radius, $fn = corner_steps);
            } else {
                translate([right - safe_radius / 2, back - safe_radius / 2, 0])
                    square([safe_radius, safe_radius], center = true);
            }

            if (round_back_left) {
                translate([left + safe_radius, back - safe_radius, 0])
                    circle(r = safe_radius, $fn = corner_steps);
            } else {
                translate([left + safe_radius / 2, back - safe_radius / 2, 0])
                    square([safe_radius, safe_radius], center = true);
            }
        }
    }
}

module keycap_jis_enter_top_hat_region_profile(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    inset,
    radius,
    region = 0,
    quality = "export"
) {
    safe_inset = jis_enter_plan_safe_inset(left, right, front, back, notch_width, notch_depth, inset);
    section_left = left + safe_inset;
    section_right = right - safe_inset;
    section_front = front + safe_inset;
    section_back = back - safe_inset;
    has_notch = jis_enter_has_notch(left, right, front, back, notch_width, notch_depth);
    section_notch_x = min(max(jis_enter_notch_x(left, right, notch_width) + safe_inset, section_left), section_right);
    section_notch_y = min(max(jis_enter_notch_y(front, back, notch_depth) + safe_inset, section_front), section_back);

    if (!has_notch) {
        keycap_jis_enter_selective_rounded_rect(
            left = section_left,
            right = section_right,
            front = section_front,
            back = section_back,
            radius = radius,
            quality = quality
        );
    } else if (region == 0) {
        keycap_jis_enter_selective_rounded_rect(
            left = section_left,
            right = section_right,
            front = section_notch_y,
            back = section_back,
            radius = radius,
            round_front_left = true,
            round_front_right = false,
            round_back_right = true,
            round_back_left = true,
            quality = quality
        );
    } else {
        keycap_jis_enter_selective_rounded_rect(
            left = section_notch_x,
            right = section_right,
            front = section_front,
            back = section_notch_y,
            radius = radius,
            round_front_left = true,
            round_front_right = true,
            round_back_right = false,
            round_back_left = false,
            quality = quality
        );
    }
}

module keycap_jis_enter_top_hat_section(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    inset,
    radius,
    z,
    region = 0,
    quality = "export"
) {
    translate([0, 0, z])
        linear_extrude(height = 0.01, center = true)
            keycap_jis_enter_top_hat_region_profile(
                left = left,
                right = right,
                front = front,
                back = back,
                notch_width = notch_width,
                notch_depth = notch_depth,
                inset = inset,
                radius = radius,
                region = region,
                quality = quality
            );
}

module keycap_jis_enter_top_hat_cap(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    top_inset,
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
    inset_limit = jis_enter_plan_inset_limit(left, right, front, back, notch_width, notch_depth);
    safe_top_inset = jis_enter_plan_safe_inset(left, right, front, back, notch_width, notch_depth, top_inset);
    safe_height = abs(height);
    requested_outset = keycap_top_hat_shoulder_outset(safe_height, shoulder_angle);
    base_inset = max(safe_top_inset - requested_outset, 0);
    actual_outset = safe_top_inset - base_inset;
    safe_top_radius = max(top_radius, 0);
    base_radius = max(safe_top_radius + actual_outset, 0);
    safe_shoulder_radius = abs(keycap_top_hat_safe_shoulder_radius(shoulder_radius));
    shoulder_radius_limit = max(min(safe_height, actual_outset), 0);
    shoulder_curve_amount = shoulder_radius_limit <= 0.001
        ? 0
        : min(safe_shoulder_radius / shoulder_radius_limit, 1) * (shoulder_radius < 0 ? -1 : 1);
    shoulder_steps = keycap_top_hat_shoulder_curve_steps(safe_shoulder_radius, quality);
    join_overlap = 0.05;
    base_z = height < 0 ? join_overlap : -join_overlap;
    top_z = height < 0 ? -safe_height : safe_height;
    region_count = jis_enter_has_notch(left, right, front, back, notch_width, notch_depth) ? 2 : 1;

    if (safe_height > 0.001 && inset_limit > 0.001) {
        keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
            translate([0, 0, surface_z_shift])
                if (abs(shoulder_curve_amount) <= 0.001) {
                    for (region = [0 : region_count - 1]) {
                        hull() {
                            keycap_jis_enter_top_hat_section(
                                left = left,
                                right = right,
                                front = front,
                                back = back,
                                notch_width = notch_width,
                                notch_depth = notch_depth,
                                inset = base_inset,
                                radius = base_radius,
                                z = base_z,
                                region = region,
                                quality = quality
                            );
                            keycap_jis_enter_top_hat_section(
                                left = left,
                                right = right,
                                front = front,
                                back = back,
                                notch_width = notch_width,
                                notch_depth = notch_depth,
                                inset = safe_top_inset,
                                radius = safe_top_radius,
                                z = top_z,
                                region = region,
                                quality = quality
                            );
                        }
                    }
                } else {
                    for (step = [0 : shoulder_steps - 1]) {
                        for (region = [0 : region_count - 1]) {
                            hull() {
                                for (j = [step : step + 1]) {
                                    t = j / shoulder_steps;
                                    z_fraction = keycap_top_hat_curve_fraction(t, shoulder_curve_amount);
                                    keycap_jis_enter_top_hat_section(
                                        left = left,
                                        right = right,
                                        front = front,
                                        back = back,
                                        notch_width = notch_width,
                                        notch_depth = notch_depth,
                                        inset = base_inset + (safe_top_inset - base_inset) * t,
                                        radius = base_radius + (safe_top_radius - base_radius) * t,
                                        z = base_z + (top_z - base_z) * z_fraction,
                                        region = region,
                                        quality = quality
                                    );
                                }
                            }
                        }
                    }
                }
    }
}

module keycap_jis_enter_rect_outer_shell(
    left,
    right,
    front,
    back,
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
    if (right - left > 0.001 && back - front > 0.001) {
        top_left = left + top_center_height * tan(left_angle);
        top_right = right - top_center_height * tan(right_angle);
        top_front = front + top_center_height * tan(front_angle);
        top_back = back - top_center_height * tan(back_angle);

        hull() {
            keycap_base_face(
                left,
                right,
                front,
                back,
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
}

module keycap_jis_enter_outer_shell(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
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
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    base_left = jis_enter_plan_left(safe_width, safe_notch_width);
    base_right = jis_enter_plan_right(safe_width, safe_notch_width);
    base_front = -safe_depth / 2;
    base_back = safe_depth / 2;
    notch_x = jis_enter_notch_x(base_left, base_right, safe_notch_width);
    notch_y = jis_enter_notch_y(base_front, base_back, safe_notch_depth);

    if (jis_enter_has_notch(base_left, base_right, base_front, base_back, safe_notch_width, safe_notch_depth)) {
        union() {
            keycap_jis_enter_rect_outer_shell(
                left = base_left,
                right = base_right,
                front = notch_y,
                back = base_back,
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

            keycap_jis_enter_rect_outer_shell(
                left = notch_x,
                right = base_right,
                front = base_front,
                back = base_back,
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
        }
    } else {
        keycap_jis_enter_rect_outer_shell(
            left = base_left,
            right = base_right,
            front = base_front,
            back = base_back,
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
    }
}

module keycap_jis_enter_dish_bump(
    width,
    depth,
    top_left,
    top_right,
    top_front,
    top_back,
    notch_width,
    notch_depth,
    top_radius,
    top_center_height,
    dish_type,
    dish_depth,
    dish_radius,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
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
                dish_plan_width = width,
                dish_plan_depth = depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );

            keycap_jis_enter_top_prism(
                left = top_left,
                right = top_right,
                front = top_front,
                back = top_back,
                notch_width = notch_width,
                notch_depth = notch_depth,
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

module keycap_jis_enter_apply_top_surface(
    width,
    depth,
    top_left,
    top_right,
    top_front,
    top_back,
    notch_width,
    notch_depth,
    top_radius,
    top_center_height,
    dish_type = "spherical",
    dish_depth = 0,
    dish_radius = 45,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
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
                dish_plan_width = width,
                dish_plan_depth = depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    } else {
        union() {
            children();
            keycap_jis_enter_dish_bump(
                width = width,
                depth = depth,
                top_left = top_left,
                top_right = top_right,
                top_front = top_front,
                top_back = top_back,
                notch_width = notch_width,
                notch_depth = notch_depth,
                top_radius = top_radius,
                top_center_height = top_center_height,
                dish_type = dish_type,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                surface_z_shift = surface_z_shift,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_jis_enter_rect_inner_clearance_volume(
    left,
    right,
    front,
    back,
    inner_height,
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
    if (right - left > 0.001 && back - front > 0.001) {
        top_left = left + inner_height * tan(left_angle);
        top_right = right - inner_height * tan(right_angle);
        top_front = front + inner_height * tan(front_angle);
        top_back = back - inner_height * tan(back_angle);

        hull() {
            translate([0, 0, -1])
                keycap_base_face(
                    left,
                    right,
                    front,
                    back,
                    bottom_corner_radius,
                    quality
                );

            keycap_top_face(
                top_left,
                top_right,
                top_front,
                top_back,
                top_corner_radius,
                inner_height,
                pitch_deg,
                roll_deg,
                quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_jis_enter_inner_clearance_volume(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
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
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    inner_height = keycap_inner_height(top_center_height, dish_depth, top_thickness);

    outer_left = jis_enter_plan_left(safe_width, safe_notch_width);
    outer_right = jis_enter_plan_right(safe_width, safe_notch_width);
    outer_front = -safe_depth / 2;
    outer_back = safe_depth / 2;
    notch_x = jis_enter_notch_x(outer_left, outer_right, safe_notch_width);
    notch_y = jis_enter_notch_y(outer_front, outer_back, safe_notch_depth);

    inner_left = outer_left + wall;
    inner_right = outer_right - wall;
    inner_front = outer_front + wall;
    inner_back = outer_back - wall;
    inner_notch_x = notch_x + wall;
    inner_notch_y = notch_y + wall;
    inner_bottom_radius = keycap_inner_corner_radius(bottom_corner_radius, wall);
    inner_top_radius = keycap_inner_corner_radius(top_corner_radius, wall);

    if (inner_right - inner_left > 0.2 && inner_back - inner_front > 0.2) {
        if (jis_enter_has_notch(outer_left, outer_right, outer_front, outer_back, safe_notch_width, safe_notch_depth)) {
            union() {
                keycap_jis_enter_rect_inner_clearance_volume(
                    left = inner_left,
                    right = inner_right,
                    front = inner_notch_y,
                    back = inner_back,
                    inner_height = inner_height,
                    front_angle = front_angle,
                    back_angle = back_angle,
                    left_angle = left_angle,
                    right_angle = right_angle,
                    bottom_corner_radius = inner_bottom_radius,
                    top_corner_radius = inner_top_radius,
                    pitch_deg = pitch_deg,
                    roll_deg = roll_deg,
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );

                keycap_jis_enter_rect_inner_clearance_volume(
                    left = inner_notch_x,
                    right = inner_right,
                    front = inner_front,
                    back = inner_back,
                    inner_height = inner_height,
                    front_angle = front_angle,
                    back_angle = back_angle,
                    left_angle = left_angle,
                    right_angle = right_angle,
                    bottom_corner_radius = inner_bottom_radius,
                    top_corner_radius = inner_top_radius,
                    pitch_deg = pitch_deg,
                    roll_deg = roll_deg,
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );
            }
        } else {
            keycap_jis_enter_rect_inner_clearance_volume(
                left = inner_left,
                right = inner_right,
                front = inner_front,
                back = inner_back,
                inner_height = inner_height,
                front_angle = front_angle,
                back_angle = back_angle,
                left_angle = left_angle,
                right_angle = right_angle,
                bottom_corner_radius = inner_bottom_radius,
                top_corner_radius = inner_top_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_jis_enter_shell(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
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
    top_hat_inset = 1.5,
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
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    base_left = jis_enter_plan_left(safe_width, safe_notch_width);
    base_right = jis_enter_plan_right(safe_width, safe_notch_width);
    base_front = -safe_depth / 2;
    base_back = safe_depth / 2;
    top_left = base_left + top_center_height * tan(left_angle);
    top_right = base_right - top_center_height * tan(right_angle);
    top_front = base_front + top_center_height * tan(front_angle);
    top_back = base_back - top_center_height * tan(back_angle);

    difference() {
        union() {
            keycap_jis_enter_apply_top_surface(
                width = safe_width,
                depth = safe_depth,
                top_left = top_left,
                top_right = top_right,
                top_front = top_front,
                top_back = top_back,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
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
                keycap_jis_enter_outer_shell(
                    width = safe_width,
                    depth = safe_depth,
                    top_center_height = top_center_height,
                    notch_width = safe_notch_width,
                    notch_depth = safe_notch_depth,
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
                keycap_jis_enter_top_hat_cap(
                    left = top_left,
                    right = top_right,
                    front = top_front,
                    back = top_back,
                    notch_width = safe_notch_width,
                    notch_depth = safe_notch_depth,
                    top_inset = top_hat_inset,
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
                        safe_width,
                        safe_depth
                    ),
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );
            }
        }

        keycap_jis_enter_inner_clearance_volume(
            width = safe_width,
            depth = safe_depth,
            top_center_height = top_center_height,
            notch_width = safe_notch_width,
            notch_depth = safe_notch_depth,
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
            keycap_jis_enter_top_hat_cap(
                left = top_left,
                right = top_right,
                front = top_front,
                back = top_back,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
                top_inset = top_hat_inset,
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
                    safe_width,
                    safe_depth
                ),
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

function jis_enter_typewriter_is_axis_aligned(pitch_deg, roll_deg, top_offset_x = 0, top_offset_y = 0) =
    abs(pitch_deg) <= 0.001
    && abs(roll_deg) <= 0.001
    && abs(top_offset_x) <= 0.001
    && abs(top_offset_y) <= 0.001;
function jis_enter_typewriter_plan_has_inner_profile(left, right, front, back, notch_width, notch_depth, inset) =
    let(
        safe_inset = max(inset, 0),
        inner_left = left + safe_inset,
        inner_right = right - safe_inset,
        inner_front = front + safe_inset,
        inner_back = back - safe_inset,
        inner_notch_x = jis_enter_notch_x(left, right, notch_width) + safe_inset,
        inner_notch_y = jis_enter_notch_y(front, back, notch_depth) + safe_inset
    )
    inner_right - inner_left > 0.001
    && inner_back - inner_front > 0.001
    && inner_notch_x < inner_right - 0.001
    && inner_notch_y < inner_back - 0.001;
function jis_enter_typewriter_plan_corner_radius(left, right, front, back, notch_width, notch_depth, radius) =
    let(
        width = jis_enter_coord_width(left, right),
        depth = jis_enter_coord_depth(front, back),
        safe_notch_width = jis_enter_coord_notch_width(left, right, notch_width),
        safe_notch_depth = jis_enter_coord_notch_depth(front, back, notch_depth),
        lower_width = max(width - safe_notch_width, 0.2),
        upper_depth = max(depth - safe_notch_depth, 0.2),
        radius_limit = min(width, depth, lower_width, upper_depth) / 2
    )
    min(max(radius, 0), max(radius_limit, 0));
jis_enter_typewriter_rim_join_overlap = 0.02;

module keycap_jis_enter_typewriter_plan_profile(
    left,
    right,
    front,
    back,
    notch_width,
    notch_depth,
    radius,
    quality = "export"
) {
    safe_notch_width = jis_enter_coord_notch_width(left, right, notch_width);
    safe_notch_depth = jis_enter_coord_notch_depth(front, back, notch_depth);
    notch_x = jis_enter_notch_x(left, right, safe_notch_width);
    notch_y = jis_enter_notch_y(front, back, safe_notch_depth);
    safe_radius = jis_enter_typewriter_plan_corner_radius(
        left,
        right,
        front,
        back,
        safe_notch_width,
        safe_notch_depth,
        radius
    );

    if (jis_enter_has_notch(left, right, front, back, safe_notch_width, safe_notch_depth)) {
        union() {
            rounded_rect_coords(
                left,
                right,
                notch_y,
                back,
                safe_radius,
                quality
            );

            rounded_rect_coords(
                notch_x,
                right,
                front,
                back,
                safe_radius,
                quality
            );
        }
    } else {
        rounded_rect_coords(
            left,
            right,
            front,
            back,
            safe_radius,
            quality
        );
    }
}

module keycap_jis_enter_typewriter_top_prism(
    width,
    depth,
    notch_width,
    notch_depth,
    corner_radius,
    top_center_height,
    pitch_deg = 0,
    roll_deg = 0,
    height = 1,
    base_z = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    left = jis_enter_plan_left(safe_width, safe_notch_width);
    right = jis_enter_plan_right(safe_width, safe_notch_width);
    front = -safe_depth / 2;
    back = safe_depth / 2;

    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg, top_offset_x, top_offset_y)
        translate([0, 0, base_z])
            linear_extrude(height = max(height, 0.01))
                keycap_jis_enter_typewriter_plan_profile(
                    left = left,
                    right = right,
                    front = front,
                    back = back,
                    notch_width = safe_notch_width,
                    notch_depth = safe_notch_depth,
                    radius = corner_radius,
                    quality = quality
                );
}

module keycap_jis_enter_typewriter_dish_bump(
    width,
    depth,
    notch_width,
    notch_depth,
    corner_radius,
    top_center_height,
    dish_type,
    dish_depth,
    dish_radius,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
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
                dish_plan_width = width,
                dish_plan_depth = depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );

            keycap_jis_enter_typewriter_top_prism(
                width = width,
                depth = depth,
                notch_width = notch_width,
                notch_depth = notch_depth,
                corner_radius = corner_radius,
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

module keycap_jis_enter_typewriter_apply_top_surface(
    width,
    depth,
    notch_width,
    notch_depth,
    corner_radius,
    top_center_height,
    dish_type = "spherical",
    dish_depth = 0,
    dish_radius = 45,
    pitch_deg = 0,
    roll_deg = 0,
    surface_z_shift = 0,
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
                dish_plan_width = width,
                dish_plan_depth = depth,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    } else {
        union() {
            children();
            keycap_jis_enter_typewriter_dish_bump(
                width = width,
                depth = depth,
                notch_width = notch_width,
                notch_depth = notch_depth,
                corner_radius = corner_radius,
                top_center_height = top_center_height,
                dish_type = dish_type,
                dish_depth = dish_depth,
                dish_radius = dish_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                surface_z_shift = surface_z_shift,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_jis_enter_typewriter_plan_ring(
    width,
    depth,
    notch_width,
    notch_depth,
    corner_radius,
    band_width,
    quality = "export"
) {
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    safe_band_width = max(band_width, 0);
    left = jis_enter_plan_left(safe_width, safe_notch_width);
    right = jis_enter_plan_right(safe_width, safe_notch_width);
    front = -safe_depth / 2;
    back = safe_depth / 2;
    inner_left = left + safe_band_width;
    inner_right = right - safe_band_width;
    inner_front = front + safe_band_width;
    inner_back = back - safe_band_width;
    outer_radius = jis_enter_typewriter_plan_corner_radius(
        left,
        right,
        front,
        back,
        safe_notch_width,
        safe_notch_depth,
        corner_radius
    );
    inner_radius = jis_enter_typewriter_plan_corner_radius(
        inner_left,
        inner_right,
        inner_front,
        inner_back,
        safe_notch_width,
        safe_notch_depth,
        max(corner_radius - safe_band_width, 0)
    );

    difference() {
        keycap_jis_enter_typewriter_plan_profile(
            left = left,
            right = right,
            front = front,
            back = back,
            notch_width = safe_notch_width,
            notch_depth = safe_notch_depth,
            radius = outer_radius,
            quality = quality
        );

        if (jis_enter_typewriter_plan_has_inner_profile(left, right, front, back, safe_notch_width, safe_notch_depth, safe_band_width)) {
            keycap_jis_enter_typewriter_plan_profile(
                left = inner_left,
                right = inner_right,
                front = inner_front,
                back = inner_back,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
                radius = inner_radius,
                quality = quality
            );
        }
    }
}

module keycap_jis_enter_typewriter_ring_prism(
    width,
    depth,
    notch_width,
    notch_depth,
    corner_radius,
    band_width,
    base_z = -1,
    height = 8,
    quality = "export"
) {
    translate([0, 0, base_z])
        linear_extrude(height = max(height, 0.01))
            keycap_jis_enter_typewriter_plan_ring(
                width = width,
                depth = depth,
                notch_width = notch_width,
                notch_depth = notch_depth,
                corner_radius = corner_radius,
                band_width = band_width,
                quality = quality
            );
}

module keycap_jis_enter_typewriter_cap(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
    corner_radius = 2,
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    left = jis_enter_plan_left(safe_width, safe_notch_width);
    right = jis_enter_plan_right(safe_width, safe_notch_width);
    front = -safe_depth / 2;
    back = safe_depth / 2;
    safe_corner_radius = jis_enter_typewriter_plan_corner_radius(
        left,
        right,
        front,
        back,
        safe_notch_width,
        safe_notch_depth,
        corner_radius
    );

    keycap_jis_enter_typewriter_apply_top_surface(
        width = safe_width,
        depth = safe_depth,
        notch_width = safe_notch_width,
        notch_depth = safe_notch_depth,
        corner_radius = safe_corner_radius,
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
        if (jis_enter_typewriter_is_axis_aligned(pitch_deg, roll_deg, top_offset_x, top_offset_y)) {
            linear_extrude(height = top_center_height)
                keycap_jis_enter_typewriter_plan_profile(
                    left = left,
                    right = right,
                    front = front,
                    back = back,
                    notch_width = safe_notch_width,
                    notch_depth = safe_notch_depth,
                    radius = safe_corner_radius,
                    quality = quality
                );
        } else {
            keycap_jis_enter_outer_shell(
                width = safe_width,
                depth = safe_depth,
                top_center_height = top_center_height,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
                front_angle = 0,
                back_angle = 0,
                left_angle = 0,
                right_angle = 0,
                bottom_corner_radius = safe_corner_radius,
                top_corner_radius = safe_corner_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
}

module keycap_jis_enter_typewriter_band_cap(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
    band_width,
    corner_radius = 2,
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    safe_notch_depth = jis_enter_safe_notch_depth(safe_depth, notch_depth);
    safe_band_width = max(band_width, 0);
    left = jis_enter_plan_left(safe_width, safe_notch_width);
    right = jis_enter_plan_right(safe_width, safe_notch_width);
    front = -safe_depth / 2;
    back = safe_depth / 2;
    ring_clip_height = top_center_height + max(abs(dish_depth), 0) + 2;

    if (jis_enter_typewriter_is_axis_aligned(pitch_deg, roll_deg, top_offset_x, top_offset_y)) {
        intersection() {
            keycap_jis_enter_typewriter_cap(
                width = safe_width,
                depth = safe_depth,
                top_center_height = top_center_height,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
                corner_radius = corner_radius,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );

            keycap_jis_enter_typewriter_ring_prism(
                width = safe_width,
                depth = safe_depth,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
                corner_radius = corner_radius,
                band_width = safe_band_width,
                base_z = -1,
                height = ring_clip_height,
                quality = quality
            );
        }
    } else {
        difference() {
            keycap_jis_enter_typewriter_cap(
                width = safe_width,
                depth = safe_depth,
                top_center_height = top_center_height,
                notch_width = safe_notch_width,
                notch_depth = safe_notch_depth,
                corner_radius = corner_radius,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );

            if (jis_enter_typewriter_plan_has_inner_profile(left, right, front, back, safe_notch_width, safe_notch_depth, safe_band_width)) {
                keycap_jis_enter_typewriter_cap(
                    width = safe_width - safe_band_width * 2,
                    depth = safe_depth - safe_band_width * 2,
                    top_center_height = top_center_height,
                    notch_width = safe_notch_width,
                    notch_depth = safe_notch_depth,
                    corner_radius = max(corner_radius - safe_band_width, 0),
                    top_shape_type = top_shape_type,
                    dish_radius = dish_radius,
                    dish_depth = dish_depth,
                    pitch_deg = pitch_deg,
                    roll_deg = roll_deg,
                    quality = quality,
                    top_offset_x = top_offset_x,
                    top_offset_y = top_offset_y
                );
            }
        }
    }
}

module keycap_jis_enter_typewriter_rim_side_shell(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
    band_width,
    corner_radius = 2,
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    safe_band_width = max(band_width, 0);

    if (safe_band_width > 0) {
        keycap_jis_enter_typewriter_band_cap(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            notch_width = notch_width,
            notch_depth = notch_depth,
            band_width = safe_band_width,
            corner_radius = corner_radius,
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );
    }
}

module keycap_jis_enter_typewriter_rim_top_extension(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
    band_width,
    height_up = 0,
    corner_radius = 2,
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    safe_band_width = max(band_width, 0);

    if (safe_band_width > 0 && height_up > 0) {
        difference() {
            keycap_jis_enter_typewriter_band_cap(
                width = width,
                depth = depth,
                top_center_height = top_center_height + height_up,
                notch_width = notch_width,
                notch_depth = notch_depth,
                band_width = safe_band_width,
                corner_radius = corner_radius,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );

            keycap_jis_enter_typewriter_band_cap(
                width = width,
                depth = depth,
                top_center_height = max(top_center_height - jis_enter_typewriter_rim_join_overlap, 0.01),
                notch_width = notch_width,
                notch_depth = notch_depth,
                band_width = safe_band_width,
                corner_radius = corner_radius,
                top_shape_type = top_shape_type,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality,
                top_offset_x = top_offset_x,
                top_offset_y = top_offset_y
            );
        }
    }
}

module keycap_jis_enter_typewriter_rim_bottom_extension(
    width,
    depth,
    notch_width,
    notch_depth,
    band_width,
    height_down = 0,
    corner_radius = 2,
    quality = "export"
) {
    safe_band_width = max(band_width, 0);

    if (safe_band_width > 0 && height_down > 0) {
        translate([0, 0, -height_down])
            linear_extrude(height = height_down + jis_enter_typewriter_rim_join_overlap)
                keycap_jis_enter_typewriter_plan_ring(
                    width = width,
                    depth = depth,
                    notch_width = notch_width,
                    notch_depth = notch_depth,
                    corner_radius = corner_radius,
                    band_width = safe_band_width,
                    quality = quality
                );
    }
}

module keycap_jis_enter_typewriter_rim(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
    band_width,
    height_up = 0,
    height_down = 0,
    corner_radius = 2,
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    union() {
        keycap_jis_enter_typewriter_rim_side_shell(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            notch_width = notch_width,
            notch_depth = notch_depth,
            band_width = band_width,
            corner_radius = corner_radius,
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );

        keycap_jis_enter_typewriter_rim_top_extension(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            notch_width = notch_width,
            notch_depth = notch_depth,
            band_width = band_width,
            height_up = height_up,
            corner_radius = corner_radius,
            top_shape_type = top_shape_type,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality,
            top_offset_x = top_offset_x,
            top_offset_y = top_offset_y
        );

        keycap_jis_enter_typewriter_rim_bottom_extension(
            width = width,
            depth = depth,
            notch_width = notch_width,
            notch_depth = notch_depth,
            band_width = band_width,
            height_down = height_down,
            corner_radius = corner_radius,
            quality = quality
        );
    }
}

module keycap_jis_enter_typewriter_shell(
    width,
    depth,
    top_center_height,
    notch_width,
    notch_depth,
    corner_radius = 2,
    top_shape_type = "spherical",
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export",
    top_offset_x = 0,
    top_offset_y = 0
) {
    keycap_jis_enter_typewriter_cap(
        width = width,
        depth = depth,
        top_center_height = top_center_height,
        notch_width = notch_width,
        notch_depth = notch_depth,
        corner_radius = corner_radius,
        top_shape_type = top_shape_type,
        dish_radius = dish_radius,
        dish_depth = dish_depth,
        pitch_deg = pitch_deg,
        roll_deg = roll_deg,
        quality = quality,
        top_offset_x = top_offset_x,
        top_offset_y = top_offset_y
    );
}
