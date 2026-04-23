# 高精細 preview mode 案

## 背景

現在の preview は、Three.js 側の滑らかな法線処理と、SCAD 側の feature 半径に応じた分割数調整で見た目を改善している。一方で、常時 export 相当の密度に寄せると、ブラウザ内 OpenSCAD runtime の反応速度が落ちやすい。

そのため、通常の `preview` と `export` の間に、任意で選べる高精細 preview 段階を追加する案を未採用の検討事項として残す。

## 案の概要

- 現在の `preview` は軽さ優先のまま維持する
- `high_preview` を追加し、SCAD の曲線分割数だけを `preview` より高くする
- Three.js 側の描画経路は共通にし、主に OpenSCAD 生成側の品質段階を増やす
- UI では常設ではなく、必要時だけ切り替えられる形を優先する

## 期待できる利点

- 通常操作時の応答性を壊さず、仕上がり確認時だけ密度を上げられる
- `export` を毎回回さなくても、曲面や小さい円弧の最終見え方に近い確認がしやすい
- quality 段階の責務が `preview / high_preview / export` で整理しやすい

## 主な懸念

- SCAD 側の quality 分岐が増え、各モジュールの責務が少し複雑になる
- UI に品質切り替えを出す場合、設定項目が増える
- preview と export の見た目差をどこまで許容するか、運用ルールが必要になる
- ブラウザ環境によっては `high_preview` が重すぎるケースがありうる

## このリポジトリで追加検討が必要な点

- `scad/base/keycap.scad` と `scad/modules/*.scad` の `quality` 契約を 3 段階へ広げるか
- `src/lib/keycap-scad-bundle.js` から preview job ごとに品質を渡す橋渡し方法
- UI での露出方法を常設にするか、一時的な確認用トグルにするか
- 手動確認手順と回帰サンプルで、どの品質段階を既定確認対象にするか

## 現時点の判断

未採用。まずは現在の `preview` を軽量な既定値として維持し、次のいずれかが起きたら再検討する。

- 通常 preview では曲面確認が足りず、export との往復が頻発する
- より細かい曲線や大型 R を持つ形状を追加し、現行の preview 密度では判断しづらくなる
- feature ごとに preview 密度差が大きくなり、2 段階では吸収しにくくなる
