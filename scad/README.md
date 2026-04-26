# scad ディレクトリ案内

`scad/` にはキーキャップ形状に関する SCAD 資産を置きます。ここでは、プレビュー用と本番出力用の責務分離、および body / legend を別体積で扱える構造を維持します。stem は `MX / Choc v1 / Choc v2 / Alps` の mount 差分を `modules/` に分離して扱います。

## サブディレクトリの役割

- `base/`: キーキャップ全体の基礎形状と export エントリを置く
- `modules/`: stem、legend、形状差分などの再利用モジュールを置く
- `presets/`: stem nominal constant や sample 用 parameter set を置く
- `samples/`: 形状回帰確認に使うサンプルを置く

## 現在の主要ファイル

- `base/keycap.scad`: `export_target` で `preview / body / body_core / rim / homing / legend / single_material_shape` を切り替える基礎エントリ
- `modules/keycap_shell.scad`: `top_center_height + pitch / roll` 基準の外形シェル、dish、内側 hollow
- `modules/keycap_jis_enter.scad`: JIS / ISO 系の縦長 Enter footprint 用シェル、typewriter variant、内側 hollow
- `modules/stem_mx.scad`: MX 互換 stem ボディ
- `modules/stem_choc_v1.scad`: Kailh Choc v1 向け 2 本爪 stem
- `modules/stem_choc_v2.scad`: Kailh Choc v2 向け MX 互換 stem
- `modules/stem_alps.scad`: Alps / Matias 向け stem
- `modules/homing_bar.scad`: body 側に追加するオプションの homing bar 形状
- `modules/legend_block.scad`: フォント非依存の legend ボリューム
- `modules/keycap_typewriter.scad`: 薄いタイプライター風キートップ外形
- `presets/stem-nominals.scad`: stem 形状の nominal 寸法
- `samples/keycap-1u.scad`: 回帰確認用の最小キーキャップサンプル
- `samples/keycap-jis-enter.scad`: JIS / ISO 系の縦長 Enter footprint 確認用サンプル
- `samples/keycap-typewriter-jis-enter.scad`: typewriter style の JIS Enter footprint 確認用サンプル
- `samples/keycap-typewriter.scad`: タイプライター風キートップの確認用サンプル
- `samples/keycap-typewriter-mount-height.scad`: typewriter shape の上面基準取り付け高さ確認用サンプル
- `samples/keycap-typewriter-rim.scad`: typewriter shape の key rim 分離確認用サンプル
- `samples/keycap-typewriter-rim-tilted.scad`: pitch / roll 付き typewriter key rim の接合確認用サンプル
- `samples/keycap-legend-seat.scad`: flush legend の座面切り抜き確認用サンプル
- `samples/keycap-multi-character-legend.scad`: 複数文字でも明示サイズを保つか確認するサンプル
- `samples/keycap-rounded-legend.scad`: 丸みのある書体の legend 品質確認用サンプル
- `samples/keycap-homing-bar.scad`: homing bar 単体出力の確認用サンプル
- `samples/keycap-stem-clip.scad`: 強い左右傾斜でも stem が内側天井で止まるか確認するサンプル
- `samples/keycap-surface-quality.scad`: 角丸、dish、stem 外周の曲面品質をまとめて確認するサンプル
- `samples/keycap-top-orientation.scad`: 上面中央高さ固定 + pitch / roll の確認用サンプル
- `samples/stem-mounts.scad`: mount 差分の回帰確認用サンプル

## 運用方針

- preview 用と export 用で重さや精度を分けてよい
- 色指定だけに依存せず、body と legend の分離可能性を維持する
- typewriter shape の key rim は body と別体積で扱い、3MF 側でも独立 part を維持する
- homing bar は body 側の触覚マーカーとして扱い、legend とは別責務にする
- ブラウザ内 OpenSCAD runtime へ UI パラメータを渡すときは、shape JSON から解決した明示値を wrapper SCAD の `user_*` へ注入する
- `text()` を使う場合はフォント依存を明示し、アセット配置とライセンスを確認する
