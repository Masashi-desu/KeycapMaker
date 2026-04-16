# 運用ガイド

## 目的

この文書は、今後このリポジトリを保守・拡張するときに、どのファイルを更新すればよいかをまとめたものです。

## 日常的な更新先

- 実装順序の見直し: `docs/roadmap/implementation-plan.md`
- 判断結果の追記: `docs/specs/decision-log.md`
- 前提条件の更新: `docs/specs/project-scope.md`
- Bambu Studio 確認結果: `docs/specs/bambu-studio-checklist.md` に沿って取得し、結果は `decision-log.md` へ反映

## SCAD 拡張時

- 新しい shape / profile: `scad/modules/` と `scad/base/`
- 新しい初期値セット: `scad/presets/`
- 回帰確認用サンプル: `scad/samples/`
- 設計観点の補足: `docs/research/scad-design-guidelines.md`

## UI 拡張時

- パラメータ入力と export 導線: `src/main.js`
- SCAD ファイル束ね込み: `src/lib/keycap-scad-bundle.js`
- preview 表示: `src/lib/preview-scene.js`

## OpenSCAD WASM 更新時

- 同梱物: `public/vendor/openscad/`
- 由来メモ: `public/vendor/openscad/README.md`
- 更新後は `npm run build` を通し、PoC 実行と export を再確認する

## 人間確認が必要な事項

- Bambu Studio の読み込み確認
- 色付き 3MF の実運用可否
- OpenSCAD WASM 同梱によるライセンス影響の最終確認
- フォント同梱時のライセンス確認

## 今後の拡張候補

1. `legend_block` を `text()` ベースに置き換え可能な抽象化にする
2. stem 方式を複数切り替えられるようにする
3. プロファイル別のシェル形状を追加する
4. body / legend をまとめた多ボディ 3MF PoC を追加する
5. 実ブラウザ用の自動 smoke test を追加する
