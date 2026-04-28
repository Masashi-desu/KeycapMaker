use <legend_block.scad>

module sidewall_legend_transform(origin, axis_x, axis_y, axis_z) {
    multmatrix([
        [axis_x[0], axis_y[0], axis_z[0], origin[0]],
        [axis_x[1], axis_y[1], axis_z[1], origin[1]],
        [axis_x[2], axis_y[2], axis_z[2], origin[2]],
        [0, 0, 0, 1]
    ])
        children();
}

module sidewall_legend_block(
    side,
    label,
    height,
    offset_x,
    offset_y,
    base_z,
    origin,
    axis_x,
    axis_y,
    axis_z,
    font_name = "M PLUS 1:style=Regular",
    underline_enabled = false,
    underline_width = 0,
    underline_thickness = 0,
    underline_offset_y = 0,
    outline_delta = 0,
    text_size = undef,
    quality = "export"
) {
    if (!is_undef(label) && len(label) > 0 && height > 0) {
        sidewall_legend_transform(origin, axis_x, axis_y, axis_z)
            legend_block(
                label = label,
                width = 0,
                depth = 0,
                height = height,
                offset_x = offset_x,
                offset_y = offset_y,
                base_z = base_z,
                font_name = font_name,
                underline_enabled = underline_enabled,
                underline_width = underline_width,
                underline_thickness = underline_thickness,
                underline_offset_y = underline_offset_y,
                outline_delta = outline_delta,
                text_size = text_size,
                quality = quality
            );
    }
}
