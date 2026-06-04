# J-STEM-LP01 寸法対応表

`.tmp/J-STEM-LP01.jpeg` に数値ラベルとして登場する長さは、SCAD 側では次の定数に一対一で対応させる。

| 図面ラベル | 図面上の意味 | モデル内の寸法定数 | 利用先 alias |
| --- | --- | --- | --- |
| `12.20` | 上面図のプレート全高 | `stem_j_stem_lp01_drawing_top_view_height` | `stem_j_stem_lp01_nominal_plate_depth` |
| `8.11` | 上左穴中心から右下穴中心までの X 方向距離 | `stem_j_stem_lp01_drawing_hole_pitch_x` | `stem_j_stem_lp01_nominal_hole_pitch_x` |
| `8.11` | 上左穴中心から右下穴中心までの Y 方向距離 | `stem_j_stem_lp01_drawing_hole_pitch_y` | `stem_j_stem_lp01_nominal_hole_pitch_y` |
| `1.20` | MX 十字穴の横向きスロット幅 | `stem_j_stem_lp01_drawing_cross_width_horizontal` | `stem_j_stem_lp01_nominal_cross_width_horizontal` |
| `1.20` | MX 十字穴の縦向きスロット幅 | `stem_j_stem_lp01_drawing_cross_width_vertical` | `stem_j_stem_lp01_nominal_cross_width_vertical` |
| `0.80` | プレート厚み | `stem_j_stem_lp01_drawing_plate_thickness` | `stem_j_stem_lp01_nominal_plate_thickness` |
| `φ5.40` | 中央円筒ポスト径 | `stem_j_stem_lp01_drawing_post_diameter` | `stem_j_stem_lp01_nominal_post_diameter` |
| `3.78` | 中央円筒ポスト高さ | `stem_j_stem_lp01_drawing_post_height` | `stem_j_stem_lp01_nominal_post_height` |

上面外形の曲線とねじ穴径は図面に数値ラベルがないため、`scad/modules/stem_j_stem_lp01.scad` 内で画像トレース値として保持する。特に `stem_j_stem_lp01_nominal_plate_width` と `stem_j_stem_lp01_nominal_hole_diameter` は図面ラベル由来ではなく、上面図の書き出し形状を合わせるためのトレース値である。受け座の標準クリアランスは `stem_j_stem_lp01_nominal_recess_clearance = 0` とし、外周に見える隙間を作らない。必要な調整は UI から渡る `stemOuterDelta` / `stemCrossMargin` で明示的に行う。
