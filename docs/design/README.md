# design歴史資料

`docs/design/` は、初期画面設計に使ったPencil sourceとrenderを歴史資料として保存する場所です。`.pen` の最終更新は2026-05-10で、その後にproject、font/icon、export UIが更新されているため、現在の画面仕様の正本ではありません。

## 収録内容

- `Keycap_maker.pen`: 初期画面設計の編集元
- `assets/keycap-render.png`: `.pen` が参照する当時のrender

## 運用ルール

- 現行behaviorは `src/`、自動test、[architecture](../architecture/overview.md)、[manual verification](../guide/manual-verification.md) を正とします
- `.pen` を再び設計sourceとして採用する場合は、現行UIへ同期したcommitと対象範囲をこの文書へ記録します
- 歴史資料の状態では、実装を `.pen` へ合わせる受け入れ条件にしません
