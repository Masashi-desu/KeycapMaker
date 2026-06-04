function j_stem_lp01_curve_steps(
    diameter,
    quality = "export",
    preview_angle = 12,
    export_angle = 6,
    preview_chord = 0.7,
    export_chord = 0.3,
    minimum_steps = 12,
    preview_max_steps = 40,
    export_max_steps = 72
) =
    let(
        safe_radius = max(diameter / 2, 0.01),
        max_angle = quality == "preview" ? preview_angle : export_angle,
        max_chord = quality == "preview" ? preview_chord : export_chord,
        max_steps = quality == "preview" ? preview_max_steps : export_max_steps,
        angle_steps = ceil(360 / max(max_angle, 0.1)),
        chord_steps = ceil(2 * PI * safe_radius / max(max_chord, 0.01))
    )
    min(max(max(angle_steps, chord_steps), minimum_steps), max_steps);

function j_stem_lp01_scale_point(point, hole_pitch_x = 8.11, plate_height = 12.2) =
    [point[0] * hole_pitch_x / 8.11, point[1] * plate_height / 12.2];

function j_stem_lp01_plate_outline_points(hole_pitch_x = 8.11, plate_height = 12.2) =
    let(
        source_points = [
            [-5.580,  6.100],
            [ 2.964,  6.100],
            [ 3.378,  5.962],
            [ 3.627,  5.630],
            [ 3.710,  5.188],
            [ 3.710, -0.808],
            [ 3.792, -1.140],
            [ 4.262, -1.886],
            [ 5.119, -2.742],
            [ 6.003, -3.654],
            [ 6.114, -4.539],
            [ 6.114, -5.312],
            [ 5.810, -5.782],
            [ 5.285, -6.100],
            [-3.080, -6.100],
            [-3.340, -6.060],
            [-3.560, -5.900],
            [-3.690, -5.650],
            [-3.700, -5.340],
            [-3.700, -2.466],
            [-3.700,  0.100],
            [-3.850,  0.650],
            [-3.990,  1.050],
            [-4.230,  1.250],
            [-4.490,  1.610],
            [-4.720,  1.950],
            [-4.990,  2.280],
            [-5.220,  2.520],
            [-5.550,  2.820],
            [-6.080,  3.200],
            [-6.120,  3.520],
            [-6.120,  5.320],
            [-6.070,  5.620],
            [-5.910,  5.880],
            [-5.700,  6.050]
        ]
    )
    [for (point = source_points) j_stem_lp01_scale_point(point, hole_pitch_x, plate_height)];

module j_stem_lp01_plate_outline_2d(
    hole_pitch_x = 8.11,
    plate_height = 12.2,
    clearance = 0,
    quality = "export"
) {
    safe_clearance = max(clearance, -0.3);

    offset(delta = safe_clearance)
        polygon(points = j_stem_lp01_plate_outline_points(hole_pitch_x, plate_height));
}

module j_stem_lp01_mount_holes_2d(
    hole_pitch_x = 8.11,
    hole_pitch_y = 8.11,
    hole_diameter = 1.7,
    quality = "export"
) {
    hole_steps = j_stem_lp01_curve_steps(hole_diameter, quality);

    for (position = [[-hole_pitch_x / 2, hole_pitch_y / 2], [hole_pitch_x / 2, -hole_pitch_y / 2]]) {
        translate(position)
            circle(d = hole_diameter, $fn = hole_steps);
    }
}

module j_stem_lp01_plate_top_2d(
    hole_pitch_x = 8.11,
    plate_height = 12.2,
    hole_pitch_y = 8.11,
    hole_diameter = 1.7,
    clearance = 0,
    include_holes = true,
    quality = "export"
) {
    if (include_holes) {
        difference() {
            j_stem_lp01_plate_outline_2d(hole_pitch_x, plate_height, clearance, quality);
            j_stem_lp01_mount_holes_2d(
                hole_pitch_x = hole_pitch_x,
                hole_pitch_y = hole_pitch_y,
                hole_diameter = hole_diameter,
                quality = quality
            );
        }
    } else {
        j_stem_lp01_plate_outline_2d(hole_pitch_x, plate_height, clearance, quality);
    }
}

module j_stem_lp01_cross_slot(length, width, height) {
    translate([-length / 2, -width / 2, 0])
        cube([length, width, height]);
}

module j_stem_lp01_mx_socket_cut(
    height,
    cross_width_horizontal = 1.2,
    cross_length_horizontal = 5.4,
    cross_width_vertical = 1.2,
    cross_length_vertical = 5.4,
    z = 0
) {
    translate([0, 0, z]) {
        j_stem_lp01_cross_slot(cross_length_horizontal, cross_width_horizontal, height);
        j_stem_lp01_cross_slot(cross_width_vertical, cross_length_vertical, height);
    }
}

module j_stem_lp01_switch_socket_post(
    post_diameter = 5.4,
    post_height = 3.78,
    cross_width_horizontal = 1.2,
    cross_width_vertical = 1.2,
    quality = "export"
) {
    post_steps = j_stem_lp01_curve_steps(post_diameter, quality);

    difference() {
        translate([0, 0, 0])
            cylinder(d = post_diameter, h = post_height, $fn = post_steps);

        j_stem_lp01_mx_socket_cut(
            post_height + 0.04,
            cross_width_horizontal = cross_width_horizontal,
            cross_length_horizontal = post_diameter,
            cross_width_vertical = cross_width_vertical,
            cross_length_vertical = post_diameter,
            z = -0.02
        );
    }
}

module j_stem_lp01_receiver_recess(
    hole_pitch_x = 8.11,
    plate_height = 12.2,
    hole_pitch_y = 8.11,
    hole_diameter = 1.7,
    height = 1,
    clearance = 0,
    quality = "export"
) {
    safe_height = max(height, 0.01);

    linear_extrude(height = safe_height)
        j_stem_lp01_plate_top_2d(
            hole_pitch_x = hole_pitch_x,
            plate_height = plate_height,
            hole_pitch_y = hole_pitch_y,
            hole_diameter = hole_diameter,
            clearance = clearance,
            include_holes = true,
            quality = quality
        );
}

module j_stem_lp01_model(
    hole_pitch_x = 8.11,
    plate_height = 12.2,
    plate_thickness = 0.8,
    hole_pitch_y = 8.11,
    hole_diameter = 1.7,
    post_diameter = 5.4,
    post_height = 3.78,
    cross_width_horizontal = 1.2,
    cross_width_vertical = 1.2,
    quality = "export"
) {
    post_mount_overlap = 0.02;

    union() {
        linear_extrude(height = plate_thickness)
            j_stem_lp01_plate_top_2d(
                hole_pitch_x = hole_pitch_x,
                plate_height = plate_height,
                hole_pitch_y = hole_pitch_y,
                hole_diameter = hole_diameter,
                include_holes = true,
                quality = quality
            );

        // The plate occupies the keycap-side receiver; the socket post points outward toward the switch.
        translate([0, 0, -post_height])
            j_stem_lp01_switch_socket_post(
                post_diameter = post_diameter,
                post_height = post_height + post_mount_overlap,
                cross_width_horizontal = cross_width_horizontal,
                cross_width_vertical = cross_width_vertical,
                quality = quality
            );
    }
}
