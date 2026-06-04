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

function j_stem_lp01_lerp(a, b, t) = a + (b - a) * t;

function j_stem_lp01_lerp_point(a, b, t) = [
    j_stem_lp01_lerp(a[0], b[0], t),
    j_stem_lp01_lerp(a[1], b[1], t)
];

function j_stem_lp01_arc_points(center, radius, start_angle, end_angle, steps) =
    [for (i = [0:steps])
        let(angle = start_angle + (end_angle - start_angle) * i / max(steps, 1))
        [center[0] + cos(angle) * radius, center[1] + sin(angle) * radius]
    ];

function j_stem_lp01_cubic_bezier_point(p0, p1, p2, p3, t) =
    j_stem_lp01_lerp_point(
        j_stem_lp01_lerp_point(
            j_stem_lp01_lerp_point(p0, p1, t),
            j_stem_lp01_lerp_point(p1, p2, t),
            t
        ),
        j_stem_lp01_lerp_point(
            j_stem_lp01_lerp_point(p1, p2, t),
            j_stem_lp01_lerp_point(p2, p3, t),
            t
        ),
        t
    );

function j_stem_lp01_cubic_bezier_points(p0, p1, p2, p3, steps) =
    [for (i = [0:steps]) j_stem_lp01_cubic_bezier_point(p0, p1, p2, p3, i / max(steps, 1))];

function j_stem_lp01_plate_outline_base_points(quality = "export") =
    let(
        arc_steps = quality == "preview" ? 8 : 18,
        curve_steps = quality == "preview" ? 7 : 16,
        top_left_center = [-5.250, 5.220],
        top_left_radius = 0.880,
        top_right_center = [ 2.760, 5.180],
        top_right_radius = 0.920,
        bottom_right_center = [5.135, -5.170],
        bottom_right_radius = 0.940,
        bottom_left_center = [-2.820, -5.200],
        bottom_left_radius = 0.900
    )
    concat(
        [[top_left_center[0], top_left_center[1] + top_left_radius]],
        [[top_right_center[0], top_right_center[1] + top_right_radius]],
        j_stem_lp01_arc_points(top_right_center, top_right_radius, 90, 0, arc_steps),
        [[3.680, 0.060]],
        j_stem_lp01_cubic_bezier_points([3.680, 0.060], [3.680, -0.760], [3.960, -1.250], [4.250, -1.610], curve_steps),
        j_stem_lp01_cubic_bezier_points([4.250, -1.610], [4.930, -2.250], [6.020, -3.220], [6.050, -3.830], curve_steps),
        [[bottom_right_center[0] + bottom_right_radius, bottom_right_center[1]]],
        j_stem_lp01_arc_points(bottom_right_center, bottom_right_radius, 0, -90, arc_steps),
        [[bottom_left_center[0], bottom_left_center[1] - bottom_left_radius]],
        j_stem_lp01_arc_points(bottom_left_center, bottom_left_radius, -90, -180, arc_steps),
        [[-3.720, 0.060]],
        j_stem_lp01_cubic_bezier_points([-3.720, 0.060], [-3.560, 1.080], [-5.360, 2.760], [-5.940, 3.300], curve_steps),
        j_stem_lp01_cubic_bezier_points([-5.940, 3.300], [-6.130, 3.450], [-6.120, 3.670], [-6.120, 3.900], curve_steps),
        [[-6.120, top_left_center[1]]],
        j_stem_lp01_arc_points(top_left_center, top_left_radius, 180, 90, arc_steps)
    );

function j_stem_lp01_plate_outline_points(hole_pitch_x = 8.11, plate_height = 12.2, quality = "export") =
    [for (point = j_stem_lp01_plate_outline_base_points(quality)) j_stem_lp01_scale_point(point, hole_pitch_x, plate_height)];

module j_stem_lp01_plate_outline_2d(
    hole_pitch_x = 8.11,
    plate_height = 12.2,
    clearance = 0,
    quality = "export"
) {
    safe_clearance = max(clearance, -0.3);

    offset(delta = safe_clearance)
        polygon(points = j_stem_lp01_plate_outline_points(hole_pitch_x, plate_height, quality));
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
