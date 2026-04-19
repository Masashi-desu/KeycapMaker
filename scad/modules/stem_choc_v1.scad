function positive_choc_stem_dimension(value, minimum = 0.1) = max(value, minimum);

module choc_v1_prong(prong_width, prong_depth, prong_height, lead_in) {
    safe_width = positive_choc_stem_dimension(prong_width);
    safe_depth = positive_choc_stem_dimension(prong_depth);
    safe_height = max(prong_height, 0.2);
    safe_lead_in = min(lead_in, safe_width * 0.4, safe_depth * 0.2, safe_height * 0.4);

    hull() {
        linear_extrude(height = max(safe_height - safe_lead_in, 0.01))
            square([safe_width, safe_depth], center = true);

        translate([0, 0, safe_height - 0.01])
            linear_extrude(height = 0.01)
                square([
                    positive_choc_stem_dimension(safe_width - safe_lead_in * 2),
                    positive_choc_stem_dimension(safe_depth - safe_lead_in * 2)
                ], center = true);
    }
}

module stem_choc_v1(
    prong_width = 1.2,
    prong_depth = 3.0,
    prong_spacing = 5.7,
    stem_height = 3.0,
    base_clearance = 0,
    lead_in = 0.12,
    quality = "export"
) {
    for (offset_x = [prong_spacing / 2, -prong_spacing / 2]) {
        translate([offset_x, 0, base_clearance])
            choc_v1_prong(prong_width, prong_depth, stem_height, lead_in);
    }
}
