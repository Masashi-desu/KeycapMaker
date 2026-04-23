function homing_bar_curve_steps(
    diameter,
    quality = "export",
    preview_angle = 12,
    export_angle = 6,
    preview_chord = 0.5,
    export_chord = 0.25,
    minimum_steps = 18,
    preview_max_steps = 30,
    export_max_steps = 60
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

module homing_bar_profile(length, width, quality = "export") {
    end_steps = homing_bar_curve_steps(width, quality);
    cap_length = max(length, width);

    hull() {
        translate([-cap_length / 2 + width / 2, 0])
            circle(d = width, $fn = end_steps);
        translate([ cap_length / 2 - width / 2, 0])
            circle(d = width, $fn = end_steps);
    }
}

module homing_bar_blank(
    length,
    width,
    height,
    base_thickness,
    offset_y,
    base_z,
    quality = "export"
) {
    cap_height = max(height, 0.05);
    contact_height = max(base_thickness, 0.05);
    contact_length = length + contact_height * 1.6;
    contact_width = width + contact_height * 1.2;

    translate([0, offset_y, base_z])
        union() {
            hull() {
                linear_extrude(height = 0.01)
                    homing_bar_profile(contact_length, contact_width, quality);
                translate([0, 0, contact_height])
                    linear_extrude(height = 0.01)
                        homing_bar_profile(length, width, quality);
            }

            translate([0, 0, contact_height])
                linear_extrude(height = cap_height)
                    homing_bar_profile(length, width, quality);
        }
}
