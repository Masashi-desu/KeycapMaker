use <stem_choc_v2.scad>

module stem_socket(socket_width, socket_depth, socket_height, socket_inset) {
    stem_choc_v2(
        outer_diameter = min(socket_width, socket_depth),
        stem_height = socket_height,
        base_clearance = socket_inset
    );
}
