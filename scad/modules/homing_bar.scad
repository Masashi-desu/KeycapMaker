function homing_bar_quality_steps(quality, preview_steps, export_steps) =
    quality == "preview" ? preview_steps : export_steps;

module homing_bar_profile(length, width, quality = "export") {
    end_steps = homing_bar_quality_steps(quality, 18, 32);
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
