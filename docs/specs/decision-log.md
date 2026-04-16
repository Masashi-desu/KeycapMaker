# 判断記録

このファイルは、PoC や設計判断の結果を時系列で残すための記録です。未確定事項を確認済み扱いにしないため、結論だけでなく理由も簡潔に残してください。

## 記録テンプレート

### YYYY-MM-DD - タイトル

- 対象タスク:
- 結論:
- 理由:
- 次の対応:

## 初期状態

### 2026-04-16 - 初期方針の記録

- 対象タスク: 準備段階
- 結論: GitHub Pages 前提、クライアントサイド実行前提、PoC 先行で進める
- 理由: 静的ホスティング制約と 3MF / 色付き 3MF の不確実性があるため
- 次の対応: Task 01 で開発基盤を整備し、Task 02 以降でランタイムと出力形式を検証する

### 2026-04-16 - Task 01 開発基盤の採用

- 対象タスク: Task 01
- 結論: 静的配信基盤として Vite を採用し、GitHub Pages 用 base は `GITHUB_REPOSITORY` から自動解決する
- 理由: GitHub Pages と相性がよく、ローカル開発と本番ビルドの両方を単純な設定で扱えるため
- 次の対応: Task 02 で OpenSCAD WASM ランタイムを導入し、ブラウザ内 PoC を実装する

### 2026-04-16 - Task 02 OpenSCAD WASM PoC 基盤

- 対象タスク: Task 02
- 結論: OpenSCAD Playground 系の prebuilt OpenSCAD WASM バンドルを `public/vendor/openscad/` へ同梱し、最小 SCAD を OFF 出力する PoC UI を追加した
- 理由: GitHub Pages 上でも外部依存なしで OpenSCAD 構文ベースの PoC を進めやすいため
- 次の対応: Task 03 で STL 出力、Task 04 で 3MF 出力へ拡張する。ライセンス影響は人間確認待ちのまま扱う

### 2026-04-16 - Task 03 STL 出力 PoC

- 対象タスク: Task 03
- 結論: OpenSCAD WASM から binary STL を直接生成してダウンロードする経路を追加した
- 理由: STL は最小保証形式として先に成立確認しやすく、後続の Bambu Studio 読み込み確認へつなぎやすいため
- 次の対応: Task 05 で人間がビューアまたはスライサーで開き、寸法と向きを確認する

### 2026-04-16 - Task 04 3MF 出力 PoC

- 対象タスク: Task 04
- 結論: OpenSCAD WASM から OFF を出力し、ブラウザ側で 3MF パッケージを組み立てる PoC 経路を追加した
- 理由: 3MF の成立可能性を、ブラウザ内だけで確認する最短経路として扱いやすいため
- 次の対応: Task 05 で Bambu Studio 読み込み確認を行い、Task 06 で正式採用可否を判断する
