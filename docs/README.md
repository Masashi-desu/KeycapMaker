# docs ディレクトリ案内

`docs/` は、現在の実装を保守・拡張するための文書群です。未解決の TODO と採用済みの設計判断を分け、日常的に参照しやすい構成にしています。

## サブディレクトリの役割

- `architecture/`: アプリ構成、SCAD / export 契約、実装上の前提
- `guide/`: ローカル開発手順、手動確認手順、更新時の運用
- `decisions/`: 採用済みの判断を時系列で残す記録
- `reference/`: 用語や短い参照資料
- `backlog/`: 未着手または継続検討中の拡張 TODO
- `design/`: Pencil の `.pen` を含む画面デザインの正本

## 推奨読書順

1. [architecture/overview.md](architecture/overview.md)
2. [architecture/scad-and-export.md](architecture/scad-and-export.md)
3. [architecture/project-data.md](architecture/project-data.md)
4. [guide/development.md](guide/development.md)
5. [guide/manual-verification.md](guide/manual-verification.md)
6. [decisions/decision-log.md](decisions/decision-log.md)
6. 必要に応じて `backlog/` と `design/`

## 運用ルール

- 構成や責務が変わったら `architecture/` を更新する
- 日常運用や確認手順が変わったら `guide/` を更新する
- 採用した判断は [decisions/decision-log.md](decisions/decision-log.md) に残す
- 将来の拡張案や未解決事項は `backlog/` に寄せる
- 画面デザイン変更は `design/` を正本とする
