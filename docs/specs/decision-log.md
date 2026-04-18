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

### 2026-04-16 - Task 05 人間確認の固定化

- 対象タスク: Task 05
- 結論: Bambu Studio 読み込み確認は `docs/specs/bambu-studio-checklist.md` に沿って実施する
- 理由: 人間が確認すべき観点を固定し、返答の粒度を揃えるため
- 次の対応: 人間が checklist に沿って確認結果を返し、Codex が decision log に反映する

### 2026-04-16 - Task 06 暫定正式方針

- 対象タスク: Task 06
- 結論: 現時点では body / legend を別体積で扱える設計を安全側の正式候補とし、色付き 3MF は PoC 扱いのまま維持する
- 理由: 3MF と色解釈の安定性が Bambu Studio で未確認のため
- 次の対応: Task 07 以降の実装は別体積方式を前提に進め、Task 05 の結果で必要なら補正する

### 2026-04-16 - Task 07 SCAD ベース実装

- 対象タスク: Task 07
- 結論: `scad/base/keycap.scad` を基礎エントリとして、shell / stem socket / legend block / preset を分離した
- 理由: body / legend 別体積と preview / export の責務分離を、後続 UI から扱いやすい構造にするため
- 次の対応: Task 08 で UI から `user_*` パラメータを渡してこの SCAD ベースを実行する

### 2026-04-16 - Task 08 パラメータ編集 UI

- 対象タスク: Task 08
- 結論: 本体、legend、stem の主要パラメータを持つ編集 UI を追加し、`user_*` 定義を介して SCAD ベースへ受け渡す構成にした
- 理由: UI 入力責務と SCAD 幾何責務を分けたまま、後続の preview / export を同じ入力源で扱うため
- 次の対応: Task 09 で OFF プレビューを Three.js へ接続する

### 2026-04-18 - Task 07 最終ベース形状への更新

- 対象タスク: Task 07
- 結論: POC の単純シェルを、添付最終モデル由来の profile shell / Choc v2 stem / homing bar を持つ構成へ置き換えた
- 理由: 最終製品の基礎形状を `scad/modules/` に分離しつつ、body / legend 別体積と preview / export 切替の契約を維持するため
- 次の対応: UI 側で profile 差分や stem 方式をさらに増やすときも、このモジュール境界を維持して拡張する

### 2026-04-18 - Task 07 homing bar と legend の責務分離

- 対象タスク: Task 07
- 結論: 元モデルのキートップ凸は homing bar として body 側オプションに残し、印字用 legend は別ボディオプションとして並立させた
- 理由: 触覚マーカーと印字は製造上も UI 上も別責務であり、同一パラメータとして扱うと拡張不能になるため
- 次の対応: 将来 `text()` ベースの印字へ進める際も、homing bar を body、legend を別 volume とする構成を維持する

### 2026-04-18 - Task 08 browser runtime パラメータ橋渡し修正

- 対象タスク: Task 08
- 結論: browser 内 OpenSCAD runtime では `-D` 上書きが安定しなかったため、実行ごとに wrapper SCAD を生成して `user_*` 定義を注入する方式へ切り替えた
- 理由: UI で編集した数値とチェックボックスを、preview / export の両経路で確実に同じ形状へ反映させるため
- 次の対応: 追加パラメータを増やす際も、wrapper 生成と `user_*` 定義を同時に更新して回帰確認する

### 2026-04-16 - Task 09 プレビュー改善

- 対象タスク: Task 09
- 結論: preview は OFF メッシュ生成、表示は Three.js の動的 import に分離し、入力変更時はデバウンス更新する構成にした
- 理由: export と別責務の軽量プレビュー経路を持ちつつ、通常 UI の初期ロードを重くしすぎないため
- 次の対応: Task 10 で GitHub Pages 配信を整え、実ブラウザでの最終確認を進める

### 2026-04-16 - Task 10 GitHub Pages デプロイ整備

- 対象タスク: Task 10
- 結論: `.github/workflows/deploy-pages.yml` を追加し、`npm ci -> npm run build -> Pages artifact upload -> deploy` の流れを固定した
- 理由: GitHub Pages での公開経路をリポジトリ内に閉じるため
- 次の対応: GitHub 側の Pages 設定確認と公開 URL の人間確認を行う

### 2026-04-16 - Task 11 運用と拡張

- 対象タスク: Task 11
- 結論: `docs/specs/operations-guide.md` と `docs/roadmap/checkpoints.md` を追加し、更新先と拡張候補を固定した
- 理由: 新規作業者が文書だけで継続開発できる状態を維持するため
- 次の対応: Task 05 の人間確認結果を反映し、必要なら出力戦略を補正する
