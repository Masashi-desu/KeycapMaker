function legend_quality_steps(quality, preview_steps, export_steps) =
    quality == "preview" ? preview_steps : export_steps;
function legend_text_curve_steps(quality = "export") =
    legend_quality_steps(quality, 48, 96);
function legend_text_internal_scale(quality = "export") =
    legend_quality_steps(quality, 6, 10);
// Keep legend size tied to the user's explicit control value without auto-fitting by label length.
function legend_text_size(size) = max(size, 0);

module legend_text_shape(label, size, font_name, curve_steps = 48) {
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
    font_name,
    outline_delta = 0,
    curve_steps = 48
) {
    if (abs(outline_delta) > 0.0001) {
        offset(delta = outline_delta)
            legend_text_shape(
                label = label,
                size = size,
                font_name = font_name,
                curve_steps = curve_steps
            );
    } else {
        legend_text_shape(
            label = label,
            size = size,
            font_name = font_name,
            curve_steps = curve_steps
        );
    }
}

module legend_icon_shape(icon_path, size) {
    // Legend icon assets are generated in a 24 mm square coordinate space.
    scale([size / 24, size / 24, 1])
        import(file = icon_path, center = true);
}

module legend_icon_profile(
    icon_path,
    size,
    outline_delta = 0
) {
    if (abs(outline_delta) > 0.0001) {
        offset(delta = outline_delta)
            legend_icon_shape(
                icon_path = icon_path,
                size = size
            );
    } else {
        legend_icon_shape(
            icon_path = icon_path,
            size = size
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
    font_name = "M PLUS 1:style=Regular",
    underline_enabled = false,
    underline_width = 0,
    underline_thickness = 0,
    underline_offset_y = 0,
    content_type = "text",
    icon_path = "",
    outline_delta = 0,
    text_size = undef,
    quality = "export"
) {
    is_icon = content_type == "icon" && len(icon_path) > 0;
    if (is_icon || (!is_undef(label) && len(label) > 0)) {
        size = legend_text_size(is_undef(text_size) ? depth : text_size);
        curve_steps = legend_text_curve_steps(quality);
        internal_scale = legend_text_internal_scale(quality);

        translate([offset_x, offset_y, base_z])
            linear_extrude(height = height, center = false, convexity = 10)
                // Build glyph outlines at a larger internal scale so the bundled runtime
                // preserves more of the original font curvature before scaling back down.
                scale([1 / internal_scale, 1 / internal_scale, 1])
                    union() {
                        if (is_icon) {
                            legend_icon_profile(
                                icon_path = icon_path,
                                size = size * internal_scale,
                                outline_delta = outline_delta * internal_scale
                            );
                        } else {
                            legend_text_profile(
                                label = label,
                                size = size * internal_scale,
                                font_name = font_name,
                                outline_delta = outline_delta * internal_scale,
                                curve_steps = curve_steps
                            );
                        }

                        if (!is_icon && underline_enabled && underline_width > 0 && underline_thickness > 0) {
                            translate([0, underline_offset_y * internal_scale])
                                square(
                                    [underline_width * internal_scale, underline_thickness * internal_scale],
                                    center = true
                                );
                        }
                    }
    }
}
