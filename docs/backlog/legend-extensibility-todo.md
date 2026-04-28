# legend 拡張 TODO

## 目的

将来の side legend、キートップ上の複数 legend、legend ごとの色や書体差し替えを追加するときに、現在の SCAD / UI / export 構造のどこが詰まりやすいかを先に整理し、段階的に進める方針を残す。

## 現状判断

- body と legend は separate volume として扱っており、その点では疎結合
- 文字形状の生成は `scad/modules/legend_block.scad` に分離されている
- キートップ legend の露出面は `scad/base/keycap.scad` で top dish 前提の surface fitting を使う
- UI と bridge はキートップ `user_legend_*` と固定 4 面の `user_side_legend_*` を持つ
- 3MF 生成器は可変個 mesh を扱えるため、ボトルネックは主に UI / bridge / SCAD 配置面の層にある

## 結論

- 単一 top legend:
  現状の構成で維持できる
- 複数 top legend:
  データモデルとジョブ生成の拡張が必要
- side legend:
  front / back / left / right の固定 4 面は対応済み。各側面の中央基準面の傾きには追従し、壁の内側面まで自動で埋め込む。任意面、複数 side legend、角丸や欠き込みへの厳密追従は未対応

## 主な詰まりどころ

### 1. 面種別の抽象がない

- `keycap_legend()` が top dish の露出帯を直接使っている
- front / back / left / right への拡張点がない

### 2. データモデルは固定 legend 前提

- `src/main.js` の UI はキートップ 1 件と sidewall 4 面の固定項目を持つ
- 任意個の `legendItems[]` にはまだ移行していない

### 3. レイヤー管理が固定名

- preview / export は `body` / `homing` / `legend` の固定ジョブを前提にしている
- legend が複数になると part 管理の一般化が必要

### 4. フォント読み込みが単一書体前提

- runtime asset は選択中の 1 書体分だけ積む
- legend ごとに書体を変えるなら使用フォント集合の収集が必要

## 推奨方針

### Phase 1. 配置面の責務分離

- top dish の露出帯を legend 共通ロジックから分離する
- `keycap_dish_band()` を top 配置面実装として切り出せる状態にする

### Phase 2. `legendItems[]` への移行

- 単数の `legend*` 項目を複数 item モデルへ寄せる
- JSON 読み込み時は既存単数形式から移行できるようにする

### Phase 3. part / layer 管理の一般化

- 固定レイヤー名ではなく、可変個 part を preview / export に流す
- overlay 判定は `name` 固定ではなく属性で扱う

### Phase 4. side legend の導入

- `front` / `back` / `left` / `right` 用の配置面モジュールを追加する
- 角丸や傾斜に対する許容範囲を仕様化する

### Phase 5. サンプルと検証の追加

- 複数 top legend 用サンプルを追加する
- side legend 用サンプルを追加する
- preview / export / Bambu Studio での確認観点を追加する

## 最初の一手

最初に着手するなら Phase 1 の「配置面の責務分離」を優先する。現行 UI を壊さず、複数 legend と side legend の両方に効くため。
