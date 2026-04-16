module legend_block(width, depth, height, offset_x, offset_y, base_z) {
    translate([offset_x, offset_y, base_z + height / 2])
        cube([width, depth, height], center = true);
}
