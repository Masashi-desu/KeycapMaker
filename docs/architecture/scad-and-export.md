# SCAD / Export 契約

## SCAD ディレクトリの責務

- `scad/base/`
  whole-key のエントリポイントと export 切り替え
- `scad/modules/`
  shell、legend、stem、homing bar などの再利用部品
- `scad/presets/`
  SCAD 側の既定値
- `scad/samples/`
  形状回帰確認に使うサンプル

## 現在のキーキャップエントリ

`scad/base/keycap.scad` が現在の基準エントリです。`export_target` で次を切り替えます。

- `preview`
- `body`
- `body_core`
- `homing`
- `legend`

この構成により、preview 用表示と part 単位 export を同じ基礎形状から扱います。

## separate volume の扱い

- body と legend は別体積を維持する
- homing bar は body 側の触覚マーカーとして扱い、legend と混ぜない
- body / legend / homing の相対位置は共有原点で揃える
- 色だけに依存せず、mesh 自体を part として分ける

## preview と export の責務分離

- preview:
  反応速度と見た目確認を優先する
- export:
  part 分離と形状の意味づけを優先する

現在の preview は OFF メッシュを body / homing / legend ごとに生成して Three.js へ渡します。現在の export は同じ part 群から 3MF を組み立てます。

## UI から SCAD への橋渡し

OpenSCAD browser runtime では `-D` 上書きが安定しなかったため、実行ごとに wrapper SCAD を生成して `user_*` 定義を注入します。

主な橋渡しファイル:

- `src/lib/keycap-scad-bundle.js`
- `src/data/keycap-editor-profiles.json`
- `scad/presets/standard-1u.scad`

現在のキートップ姿勢パラメータは `topCenterHeight` を基準にし、前後は `topPitchDeg`、左右は `topRollDeg` へ正規化する。UI では端高さ入力も使えるが、保存と SCAD bridge はこの正規化表現を使う。

stem は希望高さの nominal 形状を先に作り、最後に keycap 内部クリアランス volume と `intersection()` して止める。これにより、強い `pitch / roll` があっても stem はキートップ裏面に当たった位置で自動的に止まり、単純な高さ抑制より自然に追従する。

ルール:

- UI の追加パラメータは `src/main.js` と `src/lib/keycap-scad-bundle.js` を同時に更新する
- geometry contract が変わる場合は `scad/base/` または `scad/modules/` を更新する
- 既定値の責務は JS と SCAD で分けて考える

## サンプルの位置づけ

- `scad/samples/keycap-1u.scad`
  現行キーキャップ構成の回帰確認用
- `scad/samples/keycap-homing-bar.scad`
  homing bar の単体確認用
- `scad/samples/keycap-stem-clip.scad`
  強い左右傾斜で stem の上端が内部天井に沿って止まるか確認する回帰用
- `scad/samples/keycap-top-orientation.scad`
  上面中央高さ固定 + pitch / roll の回帰確認用
- `scad/samples/stem-mounts.scad`
  stem mount 差分の確認用

サンプルは現在、geometry regression のために使う。

## 現在の export 契約

### 3MF

- 出力元は OFF メッシュ
- 3MF 内では part ごとに object を分ける
- 現在の part 候補は `body`、`homing`、`legend`
- legend が無効なら legend object は含まれない
- homing bar が無効なら homing object は含まれない

### 編集データ JSON

- UI state の保存と再読み込み用
- `schemaVersion` を持つ
- geometry export ではなく、作業再開用フォーマットとして扱う

## 現在の既知制約

- legend は単一モデル
- legend の露出面は top dish 前提
- side legend は未対応
- font asset は利用中の 1 書体前提

これらの拡張 TODO は [../backlog/legend-extensibility-todo.md](../backlog/legend-extensibility-todo.md) にまとめる。

## 更新ルール

- SCAD の責務境界が変わったらこの文書を更新する
- export の part 契約が変わったらこの文書と手動確認手順を更新する
- 採用判断は [../decisions/decision-log.md](../decisions/decision-log.md) に残す
