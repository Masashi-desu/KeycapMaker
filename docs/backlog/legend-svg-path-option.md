# legend の text-to-path SVG 案

## 背景

bundled OpenSCAD runtime では、`text()` を小さいサイズで使うと曲線が粗く多角形化されやすい。現行実装では OpenSCAD 内で `$fn` と内部拡大縮小を使って改善するが、別案として「外部で文字を path 化した SVG を使う」方法も検討対象に残す。

## 案の概要

1. フォントから glyph outline を外部で path 化する
2. SVG 内の text 要素ではなく、閉じた path として保持する
3. OpenSCAD 側では `import("legend.svg")` で 2D 形状を読み込む
4. 必要に応じて `linear_extrude()` して legend volume にする

## 期待できる利点

- OpenSCAD の `text()` 実装に依存せず、事前に制御した輪郭を使える
- font ごとの字形差を、glyph outline の段階で固定できる
- 輪郭生成を JS 側へ逃がせば、将来的に複数 legend や icon 系にも広げやすい

## 主な制約

- OpenSCAD の SVG import も最終的には closed polygon として扱うため、真にベクターを保持するわけではない
- 公式マニュアル上、SVG import は text/font を直接扱わず、幾何情報へ変換された path 前提になる
- path 化の責務が OpenSCAD 外へ移るため、フォント計測、字詰め、配置、キャッシュ設計が別途必要になる
- GitHub Pages 上で完結させるには、ブラウザ側での text-to-path 実装か事前生成フローが必要になる
- UI 入力文字列を都度 SVG へ変換する場合、runtime asset と export 経路の管理が増える

## このリポジトリで追加検討が必要な点

- JS 側で glyph outline を生成するライブラリ選定
- 文字列から複数 path をまとめる座標系と原点契約
- `src/lib/keycap-scad-bundle.js` へ SVG asset を渡す bridge 設計
- preview / export の両経路で同じ legend path を再利用するキャッシュ設計
- フォントライセンス上、path 化や再配布の扱いに追加確認が必要か

## 現時点の判断

未採用。まずは OpenSCAD 内で完結する改善を優先し、次の条件のいずれかが出たら再検討する。

- `$fn` と内部拡大縮小でも丸みの品質が不足する
- 複数 legend、icon、side legend で `text()` ベースの限界が顕著になる
- ブラウザ側での glyph outline 生成を別用途でも使いたくなる

## 参考

- [OpenSCAD User Manual/Text](https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Text)
- [OpenSCAD User Manual/SVG Import](https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Importing_Geometry/SVG_Import)
