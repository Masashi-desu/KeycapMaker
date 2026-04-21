function legend_text_length(label) = max(len(label), 1);
function legend_is_single_glyph(label) = legend_text_length(label) == 1;
function legend_quality_steps(quality, preview_steps, export_steps) =
    quality == "preview" ? preview_steps : export_steps;
function legend_text_curve_steps(quality = "export") =
    legend_quality_steps(quality, 48, 96);
function legend_text_internal_scale(quality = "export") =
    legend_quality_steps(quality, 6, 10);
function legend_slant_angle(slant) =
    slant == "italic" ? 10
    : slant == "slanted" ? 18
    : 0;
function legend_print_delta(size, label) =
    legend_is_single_glyph(label)
        ? max(size * 0.07, 0.32)
        : max(size * 0.05, 0.24);
function legend_weight_delta(size, label, weight) =
    weight == "bold"
        ? legend_is_single_glyph(label)
            ? max(size * 0.06, 0.18)
            : max(size * 0.05, 0.14)
        : 0;
function legend_single_glyph_target_width(width, depth) =
    min(width * 0.96, max(depth * 1.25, 4.8));
function legend_text_size(label, width, depth, weight = "regular", slant = "none") =
    let(
        slant_factor = slant == "slanted" ? 1.12 : slant == "italic" ? 1.06 : 1,
        weight_factor = weight == "bold" ? 1.04 : 1,
        width_fit = (width * 1.5) / (legend_text_length(label) * slant_factor * weight_factor),
        depth_fit = depth * 0.98
    )
    max(min(depth_fit, width_fit), 1.0);
function legend_underline_width(label, width, size, weight, slant) =
    let(
        base_width = min(width, max(size * legend_text_length(label) * 0.72, size * 0.9)),
        style_growth = (weight == "bold" ? size * 0.18 : 0) + (slant == "none" ? 0 : size * 0.2)
    )
    min(width + style_growth, base_width + style_growth);
function legend_underline_thickness(size, weight) =
    max(size * (weight == "bold" ? 0.14 : 0.1), 0.24);

module legend_text_slanted(label, size, font_name, slant_angle, curve_steps = 48) {
    multmatrix([
        [1, tan(slant_angle), 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ])
        text(
            text = label,
            size = size,
            font = font_name,
            halign = "center",
            valign = "center",
            $fn = curve_steps
        );
}

// Keep decoration options available across bundled fonts without requiring extra font files.
module legend_text_profile(
    label,
    size,
    width,
    depth,
    font_name,
    weight = "regular",
    slant = "none",
    curve_steps = 48
) {
    slant_angle = legend_slant_angle(slant);
    print_delta = legend_print_delta(size, label);
    weight_delta = legend_weight_delta(size, label, weight);
    single_glyph = legend_is_single_glyph(label);

    offset(delta = print_delta + weight_delta)
        if (single_glyph) {
            resize([legend_single_glyph_target_width(width, depth), 0, 0], auto = [false, true, true])
                legend_text_slanted(
                    label = label,
                    size = size,
                    font_name = font_name,
                    slant_angle = slant_angle,
                    curve_steps = curve_steps
                );
        } else {
            legend_text_slanted(
                label = label,
                size = size,
                font_name = font_name,
                slant_angle = slant_angle,
                curve_steps = curve_steps
            );
        }
}

module legend_block(
    label,
    width,
    depth,
    height,
    offset_x,
    offset_y,
    base_z,
    font_name = "M PLUS 1p",
    weight = "regular",
    slant = "none",
    underline_enabled = false,
    quality = "export"
) {
    if (!is_undef(label) && len(label) > 0) {
        size = legend_text_size(label, width, depth, weight, slant);
        underline_width = legend_underline_width(label, width, size, weight, slant);
        underline_thickness = legend_underline_thickness(size, weight);
        underline_offset_y = -size * 0.58;
        curve_steps = legend_text_curve_steps(quality);
        internal_scale = legend_text_internal_scale(quality);

        translate([offset_x, offset_y, base_z])
            linear_extrude(height = height, center = false, convexity = 10)
                // Build glyph outlines at a larger internal scale so the bundled runtime
                // preserves more of the original font curvature before scaling back down.
                scale([1 / internal_scale, 1 / internal_scale, 1])
                    union() {
                        legend_text_profile(
                            label = label,
                            size = size * internal_scale,
                            width = width * internal_scale,
                            depth = depth * internal_scale,
                            font_name = font_name,
                            weight = weight,
                            slant = slant,
                            curve_steps = curve_steps
                        );

                        if (underline_enabled) {
                            translate([0, underline_offset_y * internal_scale])
                                square(
                                    [underline_width * internal_scale, underline_thickness * internal_scale],
                                    center = true
                                );
                        }
                    }
    }
}
