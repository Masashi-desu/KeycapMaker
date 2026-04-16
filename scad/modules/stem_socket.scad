module stem_socket(socket_width, socket_depth, socket_height, socket_inset) {
    translate([0, 0, socket_inset + socket_height / 2])
        cube([socket_width, socket_depth, socket_height], center = true);
}
