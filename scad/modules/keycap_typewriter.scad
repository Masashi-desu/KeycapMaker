use <keycap_shell.scad>

function typewriter_plan_corner_radius(width, depth, radius) =
    min(max(radius, 0), max(min(width, depth), 0.2) / 2);
function typewriter_plan_inset_dimension(size, inset) =
    max(size - inset * 2, 0);
function typewriter_plan_inset_corner_radius(width, depth, corner_radius, inset) =
    typewriter_plan_corner_radius(
        typewriter_plan_inset_dimension(width, inset),
        typewriter_plan_inset_dimension(depth, inset),
        max(corner_radius - inset, 0)
    );
function typewriter_plan_has_inner_profile(width, depth, inset) =
    typewriter_plan_inset_dimension(width, inset) > 0.001
    && typewriter_plan_inset_dimension(depth, inset) > 0.001;
function typewriter_is_axis_aligned(pitch_deg, roll_deg) =
    abs(pitch_deg) <= 0.001 && abs(roll_deg) <= 0.001;

module keycap_typewriter_plan_profile(
    width,
    depth,
    corner_radius,
    quality = "export"
) {
    rounded_rect_coords(
        -width / 2,
        width / 2,
        -depth / 2,
        depth / 2,
        typewriter_plan_corner_radius(width, depth, corner_radius),
        quality
    );
}

module keycap_typewriter_plan_ring(
    width,
    depth,
    corner_radius,
    band_width,
    quality = "export"
) {
    safe_band_width = max(band_width, 0);
    inner_width = typewriter_plan_inset_dimension(width, safe_band_width);
    inner_depth = typewriter_plan_inset_dimension(depth, safe_band_width);
    inner_corner_radius = typewriter_plan_inset_corner_radius(width, depth, corner_radius, safe_band_width);

    difference() {
        keycap_typewriter_plan_profile(
            width = width,
            depth = depth,
            corner_radius = corner_radius,
            quality = quality
        );

        if (typewriter_plan_has_inner_profile(width, depth, safe_band_width)) {
            keycap_typewriter_plan_profile(
                width = inner_width,
                depth = inner_depth,
                corner_radius = inner_corner_radius,
                quality = quality
            );
        }
    }
}

module keycap_typewriter_outer_shell(
    width,
    depth,
    top_center_height,
    corner_radius,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    safe_corner_radius = typewriter_plan_corner_radius(width, depth, corner_radius);

    hull() {
        keycap_base_face(
            -width / 2,
            width / 2,
            -depth / 2,
            depth / 2,
            safe_corner_radius,
            quality
        );

        keycap_top_face(
            -width / 2,
            width / 2,
            -depth / 2,
            depth / 2,
            safe_corner_radius,
            top_center_height,
            pitch_deg,
            roll_deg,
            quality
        );
    }
}

module keycap_typewriter_cap(
    width,
    depth,
    top_center_height,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    difference() {
        if (typewriter_is_axis_aligned(pitch_deg, roll_deg)) {
            linear_extrude(height = top_center_height)
                keycap_typewriter_plan_profile(
                    width = width,
                    depth = depth,
                    corner_radius = corner_radius,
                    quality = quality
                );
        } else {
            keycap_typewriter_outer_shell(
                width = width,
                depth = depth,
                top_center_height = top_center_height,
                corner_radius = corner_radius,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality
            );
        }

        keycap_dish_cut(
            top_center_height = top_center_height,
            dish_depth = dish_depth,
            dish_radius = dish_radius,
            quality = quality
        );
    }
}

module keycap_typewriter_band_cap(
    width,
    depth,
    top_center_height,
    band_width,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    safe_band_width = max(band_width, 0);
    inner_width = typewriter_plan_inset_dimension(width, safe_band_width);
    inner_depth = typewriter_plan_inset_dimension(depth, safe_band_width);
    inner_corner_radius = typewriter_plan_inset_corner_radius(width, depth, corner_radius, safe_band_width);

    difference() {
        keycap_typewriter_cap(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            corner_radius = corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );

        if (typewriter_plan_has_inner_profile(width, depth, safe_band_width)) {
            keycap_typewriter_cap(
                width = inner_width,
                depth = inner_depth,
                top_center_height = top_center_height,
                corner_radius = inner_corner_radius,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality
            );
        }
    }
}

module keycap_typewriter_rim_side_shell(
    width,
    depth,
    top_center_height,
    band_width,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    safe_band_width = max(band_width, 0);

    if (safe_band_width > 0) {
        keycap_typewriter_band_cap(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            band_width = safe_band_width,
            corner_radius = corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );
    }
}

module keycap_typewriter_rim_top_extension(
    width,
    depth,
    top_center_height,
    band_width,
    height_up = 0,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    safe_band_width = max(band_width, 0);

    if (safe_band_width > 0 && height_up > 0) {
        difference() {
            keycap_typewriter_band_cap(
                width = width,
                depth = depth,
                top_center_height = top_center_height + height_up,
                band_width = safe_band_width,
                corner_radius = corner_radius,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality
            );

            keycap_typewriter_band_cap(
                width = width,
                depth = depth,
                top_center_height = top_center_height,
                band_width = safe_band_width,
                corner_radius = corner_radius,
                dish_radius = dish_radius,
                dish_depth = dish_depth,
                pitch_deg = pitch_deg,
                roll_deg = roll_deg,
                quality = quality
            );
        }
    }
}

module keycap_typewriter_rim_bottom_extension(
    width,
    depth,
    top_center_height,
    band_width,
    height_down = 0,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    safe_band_width = max(band_width, 0);

    if (safe_band_width > 0 && height_down > 0) {
        translate([0, 0, -height_down])
            linear_extrude(height = height_down)
                keycap_typewriter_plan_ring(
                    width = width,
                    depth = depth,
                    corner_radius = corner_radius,
                    band_width = safe_band_width,
                    quality = quality
                );
    }
}

module keycap_typewriter_rim(
    width,
    depth,
    top_center_height,
    band_width,
    height_up = 0,
    height_down = 0,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    union() {
        keycap_typewriter_rim_side_shell(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            band_width = band_width,
            corner_radius = corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );

        keycap_typewriter_rim_top_extension(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            band_width = band_width,
            height_up = height_up,
            corner_radius = corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );

        keycap_typewriter_rim_bottom_extension(
            width = width,
            depth = depth,
            top_center_height = top_center_height,
            band_width = band_width,
            height_down = height_down,
            corner_radius = corner_radius,
            dish_radius = dish_radius,
            dish_depth = dish_depth,
            pitch_deg = pitch_deg,
            roll_deg = roll_deg,
            quality = quality
        );
    }
}

module keycap_typewriter_shell(
    width,
    depth,
    top_center_height,
    wall,
    top_thickness = 1.2,
    corner_radius = 9,
    dish_radius = 45,
    dish_depth = 0,
    pitch_deg = 0,
    roll_deg = 0,
    quality = "export"
) {
    keycap_typewriter_cap(
        width = width,
        depth = depth,
        top_center_height = top_center_height,
        corner_radius = corner_radius,
        dish_radius = dish_radius,
        dish_depth = dish_depth,
        pitch_deg = pitch_deg,
        roll_deg = roll_deg,
        quality = quality
    );
}
