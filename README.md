# Keycaps Maker

GitHub Pages で配信する、キーキャップ編集 Web アプリのためのリポジトリです。

このリポジトリの現在の目的は、実装そのものを完了することではなく、以後の実装をこのリポジトリ内の資料だけで継続できる状態を作ることです。進め方は `PoC -> 本実装` の順を前提とし、未確定要素は必ず検証タスクで扱います。

## 最初に読む資料

- 主手順書: [docs/roadmap/implementation-plan.md](docs/roadmap/implementation-plan.md)

この手順書を上から順に実施すれば、実装を継続できるように構成しています。各タスク内では、`Codex が実施できる作業` と `人間に依頼する作業` を分けて記載しています。

## 補助資料

- ドキュメント案内: [docs/README.md](docs/README.md)
- 技術方針メモ: [docs/research/technical-direction.md](docs/research/technical-direction.md)
- 出力形式メモ: [docs/research/export-format-notes.md](docs/research/export-format-notes.md)
- SCAD 設計方針メモ: [docs/research/scad-design-guidelines.md](docs/research/scad-design-guidelines.md)
- プロジェクト前提と制約: [docs/specs/project-scope.md](docs/specs/project-scope.md)
- 用語集: [docs/specs/glossary.md](docs/specs/glossary.md)
- Bambu Studio 確認チェックリスト: [docs/specs/bambu-studio-checklist.md](docs/specs/bambu-studio-checklist.md)
- 判断記録: [docs/specs/decision-log.md](docs/specs/decision-log.md)

## リポジトリの前提

- 配信先は GitHub Pages であり、サーバーサイド前提では進めない
- 動的処理はクライアントサイドで実行する
- ブラウザ内で OpenSCAD 系の実行基盤を利用する方針で検証を進める
- 3MF 出力と色付き 3MF の安定運用は未確定であり、先に PoC を行う
- 本番設計では、色指定だけに依存せず「本体ボディ」と「印字ボディ」を別体積として扱える構成を有力候補とする

## ディレクトリ概要

- `src/`: Web アプリ本体の実装
- `public/`: GitHub Pages でそのまま配信する静的アセット
- `scad/`: キーキャップ形状の SCAD 資産
- `docs/`: 実装手順、調査資料、仕様メモ
- `.github/workflows/`: GitHub Actions と GitHub Pages デプロイ設定の置き場
