module keycap_shell(width, depth, height, wall, top_scale) {
    inner_width = max(width - wall * 2, 1);
    inner_depth = max(depth - wall * 2, 1);

    difference() {
        linear_extrude(height = height, scale = top_scale)
            square([width, depth], center = true);

        translate([0, 0, wall])
            linear_extrude(height = max(height - wall, 0.2), scale = min(top_scale + 0.04, 1))
                square([inner_width, inner_depth], center = true);
    }
}
