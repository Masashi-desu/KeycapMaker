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

公式product pageはmodel downloadを提供していますが、STEPまたは派生物の再配布ライセンス名と許諾文を提示していません。公式利用規約はsite上の知的財産権を留保しています。推測でopen-source licenseを付けず、[第三者ライセンス文書の未解決条件](../../../docs/third-party-licenses.md#j-stem-lp01参照cadの未解決条件)として管理します。
