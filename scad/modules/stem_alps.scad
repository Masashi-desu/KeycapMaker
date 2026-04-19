function positive_alps_stem_dimension(value, minimum = 0.1) = max(value, minimum);

module alps_post(stem_length, stem_width, stem_height, lead_in) {
    safe_length = positive_alps_stem_dimension(stem_length);
    safe_width = positive_alps_stem_dimension(stem_width);
    safe_height = max(stem_height, 0.2);
    safe_lead_in = min(lead_in, safe_length * 0.2, safe_width * 0.3, safe_height * 0.4);

    hull() {
        linear_extrude(height = max(safe_height - safe_lead_in, 0.01))
            square([safe_length, safe_width], center = true);

        translate([0, 0, safe_height - 0.01])
            linear_extrude(height = 0.01)
                square([
                    positive_alps_stem_dimension(safe_length - safe_lead_in * 2),
                    positive_alps_stem_dimension(safe_width - safe_lead_in * 2)
                ], center = true);
    }
}

module stem_alps(
    stem_length = 4.45,
    stem_width = 2.25,
    stem_height = 3.5,
    base_clearance = 0,
    lead_in = 0.12,
    quality = "export"
) {
    translate([0, 0, base_clearance])
        alps_post(stem_length, stem_width, stem_height, lead_in);
}
