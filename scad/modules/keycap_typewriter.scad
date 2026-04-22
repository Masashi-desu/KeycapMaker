use <keycap_shell.scad>

function typewriter_plan_corner_radius(width, depth, radius) =
    min(max(radius, 0), max(min(width, depth), 0.2) / 2);
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
