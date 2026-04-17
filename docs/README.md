# docs ディレクトリ案内

`docs/` は、このリポジトリで実装を継続するための文書群をまとめる場所です。

## サブディレクトリの役割

- `design/`: Pencil の `.pen` を含む画面デザインの正本と、その参照用プレビューを置きます
- `roadmap/`: 実行順序を固定した主手順書と、進行管理に使う文書を置きます
- `research/`: 背景知識、比較情報、判断材料、注意事項を置きます
- `specs/`: スコープ、用語、判断記録など、実装時の基準になる文書を置きます

## 推奨読書順

1. [roadmap/implementation-plan.md](roadmap/implementation-plan.md)
2. [roadmap/checkpoints.md](roadmap/checkpoints.md)
3. [specs/project-scope.md](specs/project-scope.md)
4. 必要に応じて `research/` 配下の各資料
5. 実装や判断を進めたら [specs/decision-log.md](specs/decision-log.md) を更新

## 運用ルール

- 実装順序で迷ったら `roadmap/implementation-plan.md` を正とする
- `roadmap/implementation-plan.md` では、各タスクの中で `Codex` と `人間` の担当を分けて読む
- 背景知識は `research/` に寄せ、主手順書に比較情報を詰め込みすぎない
- 実際の判断結果は `specs/decision-log.md` に残し、未確認事項を確認済み扱いにしない
