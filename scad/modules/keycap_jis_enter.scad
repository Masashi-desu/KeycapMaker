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
    quality = "export"
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg)
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
    quality = "export"
) {
    keycap_top_plane_transform(top_center_height, pitch_deg, roll_deg)
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
    quality = "export"
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
                quality
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
    quality = "export"
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
                quality = quality
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
                quality = quality
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
            quality = quality
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
    quality = "export"
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
                quality = quality
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
                quality = quality
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
    quality = "export"
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
                quality = quality
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
                quality = quality
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
    quality = "export"
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
                quality
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
    quality = "export"
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
                    quality = quality
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
                    quality = quality
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
                quality = quality
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
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    safe_width = max(width, 0.2);
    safe_depth = max(depth, 0.2);
    safe_notch_width = jis_enter_safe_notch_width(safe_width, notch_width);
    base_left = jis_enter_plan_left(safe_width, safe_notch_width);
    base_right = jis_enter_plan_right(safe_width, safe_notch_width);
    base_front = -safe_depth / 2;
    base_back = safe_depth / 2;
    top_left = base_left + top_center_height * tan(left_angle);
    top_right = base_right - top_center_height * tan(right_angle);
    top_front = base_front + top_center_height * tan(front_angle);
    top_back = base_back - top_center_height * tan(back_angle);

    difference() {
        keycap_jis_enter_apply_top_surface(
            width = safe_width,
            depth = safe_depth,
            top_left = top_left,
            top_right = top_right,
            top_front = top_front,
            top_back = top_back,
            notch_width = safe_notch_width,
            notch_depth = notch_depth,
            top_radius = top_corner_radius,
            top_center_height = top_center_height,
            dish_type = top_shape_type,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        )
            keycap_jis_enter_outer_shell(
                width = safe_width,
                depth = safe_depth,
                top_center_height = top_center_height,
                notch_width = safe_notch_width,
                notch_depth = notch_depth,
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

        keycap_jis_enter_inner_clearance_volume(
            width = safe_width,
            depth = safe_depth,
            top_center_height = top_center_height,
            notch_width = safe_notch_width,
            notch_depth = notch_depth,
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
}
