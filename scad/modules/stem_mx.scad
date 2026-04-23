function stem_curve_steps(
    diameter,
    quality = "export",
    preview_angle = 10,
    export_angle = 5,
    preview_chord = 0.6,
    export_chord = 0.25,
    minimum_steps = 24,
    preview_max_steps = 48,
    export_max_steps = 96
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

module stem_slot(length, width, height) {
    translate([-length / 2, -width / 2, 0])
        cube([length, width, height]);
}

module stem_mx(
    outer_diameter = 5.5,
    stem_height = 4.5,
    base_clearance = 0,
    cross_width_horizontal = 1.25,
    cross_length_horizontal = 4.3,
    cross_width_vertical = 1.35,
    cross_length_vertical = 4.3,
    cross_chamfer = 0.4,
    chamfer_height = 0.6,
    quality = "export"
) {
    outer_steps = stem_curve_steps(outer_diameter, quality);
    safe_height = max(stem_height, 0.2);

    difference() {
        translate([0, 0, base_clearance])
            cylinder(d = outer_diameter, h = safe_height, $fn = outer_steps);

        translate([0, 0, base_clearance]) {
            stem_slot(cross_length_horizontal, cross_width_horizontal, safe_height + 1);
            stem_slot(cross_width_vertical, cross_length_vertical, safe_height + 1);
        }

        if (cross_chamfer > 0) {
            translate([0, 0, base_clearance - 0.01])
                hull() {
                    stem_slot(
                        cross_length_horizontal + cross_chamfer * 2,
                        cross_width_horizontal + cross_chamfer * 2,
                        0.01
                    );
                    translate([0, 0, chamfer_height])
                        stem_slot(cross_length_horizontal, cross_width_horizontal, 0.01);
                }

            translate([0, 0, base_clearance - 0.01])
                hull() {
                    stem_slot(
                        cross_width_vertical + cross_chamfer * 2,
                        cross_length_vertical + cross_chamfer * 2,
                        0.01
                    );
                    translate([0, 0, chamfer_height])
                        stem_slot(cross_width_vertical, cross_length_vertical, 0.01);
                }
        }
    }
}
