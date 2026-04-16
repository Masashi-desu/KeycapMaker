# src ディレクトリ案内

`src/` には Web アプリ本体を実装します。

## ここで扱うもの

- パラメータ編集 UI
- ブラウザ内プレビュー
- OpenSCAD 系ランタイムとの接続
- export 実行フロー

## 実装方針

- GitHub Pages 前提のため、サーバーサイド処理を前提にしない
- preview と export の責務を分ける
- UI パラメータと SCAD 幾何パラメータを分離する

実装を始めるときは、まず [../docs/roadmap/implementation-plan.md](../docs/roadmap/implementation-plan.md) の Task 01 を参照してください。
