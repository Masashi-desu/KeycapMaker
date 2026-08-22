# J-STEM-LP01 reference assets

[JezailFunder Japan公式product page](https://jezailfunder.jp/products/j-stem-lp01) が配布するCADと、そのapp preview用派生meshを保持します。

## Source and integrity

- Official download: https://cdn.shopify.com/s/files/1/0937/1798/7635/files/j-stem.step
- Review date: 2026-08-22
- `j-stem-lp01.step`: 公式downloadとbyte一致
- `j-stem-lp01.step` SHA-256: `be1ba017d35e7a6ef8d502acfd56a05b1bb73796274959871f213ddfec573ac2`
- `j-stem-lp01-reference.off` SHA-256: `6d4833f5631cd1462241a5e9487fff47199c1f3a8ebd5ce8663205cb0d9bb16f`

2026-06-14に別workspaceの一時fileから取り込んだ履歴はありますが、その一時pathは継続保守のsourceではありません。上記公式downloadを正とします。

## Derived preview mesh

`j-stem-lp01-reference.off` は、FreeCAD 1.0.0の `Shape.tessellate(0.05)` で公式STEPから生成し、既存SCADのJ-STEM local coordinatesへ次の変換を適用した派生meshです。

- `x = STEP_X - 0.3880597014925047`
- `y = STEP_Z + 0.6130028267860688`
- `z = 1.1075741889622546 - STEP_Y`

OFFのbounding boxはおおよそ `x/y = -6.1..6.1`、`z = -3.776..0.8` です。plateは `z=0..0.8`、MX socket postは `z<0` 側に置きます。appはpreview時に `topPitchDeg`、`topRollDeg`、`topOffsetX`、`topOffsetY`、stem受け座高さを適用します。

## License status

公式product pageはmodel downloadを提供していますが、STEPまたは派生物の個別ライセンス名と再配布許諾文は提示していません。本projectでは、公式配布であることと、J-STEM-LP01が加工・CAD参照・それらを用いた製作物の再利用や販売を前提とする性質の製品であることから、公式STEPと派生OFFの現行の掲載・再配布に問題ないと判断しています。

J-STEM-LP01対応機能の追加告知に対するJezailFunder JapanからのX上のLikeリアクションと、その後に取り下げ要請がないことも、掲載継続の判断経緯として記録します。これらを明示的な許諾文として扱うものではありません。判断の詳細は[第三者ライセンス文書](../../../docs/third-party-licenses.md#j-stem-lp01参照cadの掲載判断)を参照してください。

本CAD、派生資産、またはそれらの引用・掲載について権利者から異議申立てや取り下げ要請があった場合は、内容を確認したうえで対象の掲載・配信を取り下げる方針です。
