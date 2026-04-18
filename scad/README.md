# scad ディレクトリ案内

`scad/` にはキーキャップ形状に関する SCAD 資産を置きます。ここでは、プレビュー用と本番出力用の責務分離、および body / legend を別体積で扱える構造を意識します。

## サブディレクトリの役割

- `base/`: キーキャップ全体の基礎形状と export エントリを置く
- `modules/`: stem、legend、形状差分などの再利用モジュールを置く
- `presets/`: profile やキー種別ごとの初期値や定義を置く
- `samples/`: PoC や回帰確認に使う最小サンプルを置く

## 現在の主要ファイル

- `base/keycap.scad`: `export_target` で `preview / body / body_core / homing / legend` を切り替える基礎エントリ
- `modules/keycap_shell.scad`: 添付最終モデル由来の外形シェル、dish、内側 hollow
- `modules/stem_choc_v2.scad`: Choc v2 対応 stem ボディ
- `modules/homing_bar.scad`: body 側に追加するオプションの homing bar 形状
- `modules/legend_block.scad`: フォント非依存の legend ボリューム
- `presets/standard-1u.scad`: 1u キー向け既定値
- `samples/keycap-1u.scad`: 回帰確認用の最小キーキャップサンプル
- `samples/keycap-homing-bar.scad`: homing bar 単体出力の確認用サンプル

## 運用方針

- preview 用と export 用で重さや精度を分けてよい
- 色指定だけに依存せず、body と legend の分離可能性を維持する
- homing bar は body 側の触覚マーカーとして扱い、legend とは別責務にする
- ブラウザ内 OpenSCAD runtime へ UI パラメータを渡すときは、必要に応じて wrapper SCAD を生成して `user_*` を注入する
- `text()` を使う場合はフォント依存を明示し、アセット配置とライセンスを確認する
