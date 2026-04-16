# プロジェクト前提とスコープ

## プロジェクトの目的

GitHub Pages で配信するキーキャップ編集 Web アプリを構築し、ブラウザ上でパラメータ編集、プレビュー、3D 出力準備を行える状態を目指す。

## 現時点で固定する前提

- 配信は GitHub Pages を利用する
- サーバーサイド処理は前提にしない
- 動的処理はクライアントサイドで行う
- フロントエンド基盤は Vite を採用する
- ブラウザ内で OpenSCAD 系ランタイムを使う前提で PoC を進める
- 実装順序は `検証フェーズ -> 本実装フェーズ`
- 3MF 出力と色付き 3MF の安定運用は未確定
- 色指定だけに依存した本番設計は避ける
- 本番では body / legend を別体積で扱える設計を有力候補とする

## 初期フェーズの非目標

- 最初から高度な装飾や多数のキー種に対応すること
- サーバー保存やアカウント機能を追加すること
- 色付き 3MF の成功を前提に設計を固定すること

## 設計原則

1. まず PoC を通す
2. 形式の不確実性は export 戦略で吸収する
3. preview と export は責務を分ける
4. SCAD 側の幾何責務と UI 側の入力責務を混ぜない
5. 判断結果は文書に残し、暗黙知を作らない

## 暫定正式方針

- Task 05 の人間確認が終わるまでは、3MF は PoC 扱いとする
- 現時点の安全側方針として、最終 export は `body` と `legend` を別体積で扱える設計を正式候補にする
- 色付き 3MF は、Bambu Studio 互換性が人間確認で安定と判定されるまで本番前提にしない
- preview は軽量メッシュ、export は製造向けデータという責務分離を維持する

## 正式判断が必要な項目

- ブラウザ実行ランタイムの採用候補
- STL を最低保証形式として採用するか
- 3MF を正式出力形式に含めるか
- 色付き 3MF を採用するか
- body / legend の標準 export 契約
- フォント同梱方針

## GitHub Pages ベースパス方針

- `vite.config.js` で `GITHUB_ACTIONS=true` かつ `GITHUB_REPOSITORY` が与えられた場合のみ base を自動計算する
- リポジトリ名が `<user>.github.io` で終わる場合は `/` を使う
- それ以外のリポジトリでは `/${repoName}/` を使う
- ローカル開発時の base は `/` を使う

## 文書更新ルール

- 判断結果は [decision-log.md](decision-log.md) に追記する
- 前提が変わった場合は本ファイルも更新する
- 実行順序は [../roadmap/implementation-plan.md](../roadmap/implementation-plan.md) を正とする
- Bambu Studio の人間確認結果は [bambu-studio-checklist.md](bambu-studio-checklist.md) に沿って取得する
