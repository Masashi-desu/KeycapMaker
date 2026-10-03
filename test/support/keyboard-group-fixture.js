import { loadKeyboardFileLayouts } from "../../src/lib/keyboard-import.js";

export function createSplitKeyboardFixture() {
  const folder = "boards/test";
  const geometry = '<&key_physical_attrs 100 100 2000 0 0 0 0>, <&key_physical_attrs 100 100 0 0 0 0 0>, <&key_physical_attrs 100 100 1000 0 0 0 0>, <&key_physical_attrs 100 100 2100 0 0 0 0>';
  const scan = (offset, columns = 2) => `#include "layouts.dtsi"\n/ {
    transform: transform { compatible = "zmk,matrix-transform"; rows = <1>; columns = <8>;
      col-offset = <${offset}>; map = <RC(0,0) RC(0,2) RC(0,7) RC(0,1)>; };
    scan: scan { compatible = "zmk,kscan-gpio-matrix";
      row-gpios = <&gpio 0 GPIO_ACTIVE_HIGH>;
      col-gpios = ${Array.from({ length: columns }, (_, i) => `<&gpio ${i} GPIO_ACTIVE_HIGH>`).join(",")}; };
  }; &physical { transform = <&transform>; kscan = <&scan>; };`;
  const json = { layouts: { LAYOUT: { layout: [{ row: 0, col: 0, x: 20, y: 0 }, { row: 0, col: 2, x: 0, y: 0 }, { row: 0, col: 7, x: 10, y: 0 }, { row: 0, col: 1, x: 21, y: 0 }] } } };
  const files = { "config/info.json": JSON.stringify(json),
    [`${folder}/layouts.dtsi`]: `/ { physical: physical { compatible = "zmk,physical-layout"; keys = ${geometry}; }; };`,
    [`${folder}/test_left.overlay`]: scan(0), [`${folder}/test_right.overlay`]: scan(2),
    [`${folder}/Kconfig.defconfig`]: "if SHIELD_TEST_LEFT || SHIELD_TEST_RIGHT\nconfig ZMK_SPLIT\n    default y\nendif\n" };
  return { files, scan, json, load: (path = "config/info.json") => loadKeyboardFileLayouts(path, { paths: Object.keys(files), readText: async (p) => files[p] }) };
}
