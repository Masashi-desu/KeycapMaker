# 任意個legend modelへの拡張TODO

## Status

未採用です。初期計画にあった複数top legendとside legendの固定slotは実装済みです。現行仕様は [SCAD / export契約](../architecture/scad-and-export.md) を正とし、この文書は次段階の任意個modelだけを扱います。

## 現在成立している範囲

- topはcenter、right-top、right-bottom、left-top、left-bottomの5 slot
- sidewallはfront、back、left、rightの4 slot
- content typeはtext/icon、icon providerはLucide、Material Symbols、Font Awesome Free Solid、Remix Icon
- body、homing、各legendはpreview/exportで分離可能
- sidewall legendは各側面の中央基準面へ追従し、壁の内側まで埋め込む
- fixed slotごとのeditor data、SCAD bridge、preview job、3MF partが存在する

角丸やJIS Enter欠き込み面への厳密追従、任意面、同一面の任意個legend、legendごとの異なるfont集合は未対応です。

## 任意個modelで必要な変更

### Data and UI

固定field群を `legendItems[]` へ正規化し、既存JSONからlosslessに移行します。各itemはsurface/slot、content、fontまたはicon、size、offset、height、colorを所有します。UIは順序、追加、削除、surface選択を扱う必要があります。

### Runtime assets

現在は選択中fontを中心にruntime assetを組みます。legendごとにfontを変える場合は、project内で使うfont/icon asset集合を収集し、重複を除いてOpenSCAD runtimeへ渡します。

### SCAD placement

固定 `user_top_legend_*` / `user_side_legend_*` mappingから、item単位のplacement入力へ移行します。top dish band、sidewall plane、将来の任意面をsurface adapterとして分け、角丸・欠き込みへ追従する範囲を明示します。

### Preview and export

固定job/part名をitem IDと属性へ一般化し、3MF metadata、project JSON compatibility、empty mesh処理を維持します。

## Acceptance work

- legacy fixed-field JSONのimport/export compatibility test
- 複数font/icon asset bundle test
- top/side混在のSCAD sampleとgeometry regression
- 可変個partのpreview/3MF test
- affected browser操作とslicer確認

着手時は、固定slot実装を歴史的移行元としてこの文書から現行architectureへ統合し、採用判断をdecision logへ記録します。
