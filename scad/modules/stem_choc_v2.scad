function stem_quality_steps(quality, preview_steps, export_steps) =
    quality == "preview" ? preview_steps : export_steps;

module stem_slot(length, width, height) {
    translate([-length / 2, -width / 2, 0])
        cube([length, width, height]);
}

module stem_choc_v2(
    outer_diameter = 5.5,
    stem_height = 6.5,
    base_clearance = 0,
    cross_width_horizontal = 1.25,
    cross_length_horizontal = 4.3,
    cross_width_vertical = 1.35,
    cross_length_vertical = 4.3,
    cross_chamfer = 0.4,
    chamfer_height = 0.6,
    quality = "export"
) {
    outer_steps = stem_quality_steps(quality, 36, 64);
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
