// Minimum PoC sample for browser-side OpenSCAD validation.
// This sample intentionally avoids font dependencies so Task 02 can
// validate the runtime before `text()` and font packaging are introduced.

body_width = 18;
body_depth = 18;
body_height = 6;
legend_height = 0.8;

module body() {
    difference() {
        cube([body_width, body_depth, body_height], center = false);
        translate([1.2, 1.2, 1.0])
            cube([body_width - 2.4, body_depth - 2.4, body_height], center = false);
    }
}

module legend() {
    translate([5.5, 6.5, body_height])
        cube([7.0, 5.0, legend_height], center = false);
}

body();
legend();
