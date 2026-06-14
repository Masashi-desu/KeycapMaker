# J-STEM-LP01 assets

このディレクトリは J-STEM-LP01 の公式 CAD 参照アセットを置く。

- `j-stem-lp01.step`: 公式 STEP。2026-06-14 に `/Users/workSpace/OpenGraphite/.temp/j-stem.step` からコピーした。
- `j-stem-lp01-reference.off`: アプリの参照 preview で使う派生メッシュ。FreeCAD 1.0.0 の `Shape.tessellate(0.05)` で公式 STEP から生成した。

`j-stem-lp01-reference.off` は既存 SCAD の J-STEM ローカル座標に合わせて、次の変換を適用済み。

- `x = STEP_X - 0.3880597014925047`
- `y = STEP_Z + 0.6130028267860688`
- `z = 1.1075741889622546 - STEP_Y`

これにより OFF の bounding box はおおよそ `x/y = -6.1..6.1`、`z = -3.776..0.8` になる。プレートは `z=0..0.8`、MX ソケットポストは `z<0` 側に置く。アプリ側では preview 時に `topPitchDeg` / `topRollDeg` / `topOffsetX` / `topOffsetY` / stem 受け座高さを適用して配置する。
