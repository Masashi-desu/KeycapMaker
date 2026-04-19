use <stem_mx.scad>

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
    stem_mx(
        outer_diameter = outer_diameter,
        stem_height = stem_height,
        base_clearance = base_clearance,
        cross_width_horizontal = cross_width_horizontal,
        cross_length_horizontal = cross_length_horizontal,
        cross_width_vertical = cross_width_vertical,
        cross_length_vertical = cross_length_vertical,
        cross_chamfer = cross_chamfer,
        chamfer_height = chamfer_height,
        quality = quality
    );
}
