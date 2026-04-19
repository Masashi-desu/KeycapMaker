use <../modules/stem_mx.scad>
use <../modules/stem_choc_v1.scad>
use <../modules/stem_choc_v2.scad>
use <../modules/stem_alps.scad>

translate([-18, 0, 0])
    stem_mx();

translate([-6, 0, 0])
    stem_choc_v2(stem_height = 6.5);

translate([8, 0, 0])
    stem_choc_v1();

translate([18, 0, 0])
    stem_alps();
