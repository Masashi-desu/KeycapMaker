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

function homing_bar_chamfer_steps(
    chamfer,
    quality = "export",
    preview_step = 0.12,
    export_step = 0.06,
    preview_max_steps = 8,
    export_max_steps = 18
) =
    let(
        step = quality == "preview" ? preview_step : export_step,
        max_steps = quality == "preview" ? preview_max_steps : export_max_steps
    )
    chamfer <= 0 ? 1 : min(max(ceil(chamfer / max(step, 0.01)), 2), max_steps);

function homing_bar_profile_dimension(value, minimum = 0.02) = max(value, minimum);

function homing_bar_chamfer_inset(t, height, inset) =
    height <= 0 || inset <= 0
        ? 0
        : let(progress = min(max(t / height, 0), 1))
            inset * (1 - sqrt(max(1 - progress * progress, 0)));

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

module homing_bar_profile_slice(length, width, inset, z, quality = "export", slice_height = 0.01) {
    slice_z = max(z - slice_height, 0);

    translate([0, 0, slice_z])
        // Thin slices give hull() a solid section without extending the cap above the requested height.
        linear_extrude(height = slice_height)
            homing_bar_profile(
                homing_bar_profile_dimension(length - inset * 2),
                homing_bar_profile_dimension(width - inset * 2),
                quality
            );
}

module homing_bar_cap(length, width, height, chamfer = 0, quality = "export") {
    cap_height = max(height, 0.05);
    max_inset = max(width / 2 - 0.01, 0);
    cap_chamfer = min(max(chamfer, 0), max_inset);
    chamfer_height = min(cap_chamfer, cap_height);
    straight_height = cap_height - chamfer_height;
    chamfer_steps = homing_bar_chamfer_steps(cap_chamfer, quality);

    if (cap_chamfer <= 0.001 || chamfer_height <= 0.001) {
        linear_extrude(height = cap_height)
            homing_bar_profile(length, width, quality);
    } else {
        union() {
            if (straight_height > 0.001) {
                linear_extrude(height = straight_height + 0.01)
                    homing_bar_profile(length, width, quality);
            }

            for (step_index = [0:chamfer_steps - 1]) {
                t0 = chamfer_height * step_index / chamfer_steps;
                t1 = chamfer_height * (step_index + 1) / chamfer_steps;
                hull() {
                    homing_bar_profile_slice(
                        length,
                        width,
                        homing_bar_chamfer_inset(t0, chamfer_height, cap_chamfer),
                        straight_height + t0,
                        quality
                    );
                    homing_bar_profile_slice(
                        length,
                        width,
                        homing_bar_chamfer_inset(t1, chamfer_height, cap_chamfer),
                        straight_height + t1,
                        quality
                    );
                }
            }
        }
    }
}

module homing_bar_blank(
    length,
    width,
    height,
    base_thickness,
    offset_y,
    base_z,
    chamfer = 0,
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
                homing_bar_cap(length, width, cap_height, chamfer, quality);
        }
}
