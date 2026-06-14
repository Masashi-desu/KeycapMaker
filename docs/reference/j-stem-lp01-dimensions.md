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

公式 STEP は `public/assets/j-stem-lp01/j-stem-lp01.step` に置き、アプリ preview では同ディレクトリの `j-stem-lp01-reference.off` を色選択付きの位置合わせ参照として使う。クリアは半透明、白とオレンジは不透明で表示する。OFF は公式 STEP を FreeCAD 1.0.0 で tessellate し、既存の J-STEM ローカル座標へ変換した派生メッシュである。

受け座ブーリアンの上面外形は `scad/modules/stem_j_stem_lp01.scad` 内で公式 STEP から抽出した外周点列として保持する。ねじ穴径は当初の図面に数値ラベルがないため、受け座 recess の書き出し形状を合わせるためのトレース値である。受け座の nominal クリアランスは `stem_j_stem_lp01_nominal_recess_clearance = 0` として公式 STEP 外形との対応を保つ。アプリで J-STEM-LP01 へ切り替える場合は、実物確認結果に基づいて UI の `stemCrossMargin` を 0.1mm から始める。実物がきつい場合は正値方向、緩い場合は負値方向へ 0.02mm 刻みで LP01 受け座の掘り込み外形を調整する。

`scad/modules/stem_j_stem_lp01.scad` の `j_stem_lp01_model()` は旧SCAD参照モデルとして残すが、通常のアプリ preview では公式 STEP 由来 OFF を使う。
