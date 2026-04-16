# チェックポイント

この文書は、主手順書を進める途中で「何を満たせば次へ進んでよいか」を簡潔に確認するための補助資料です。

## Checkpoint A: PoC 基盤

- Vite ベースの静的アプリがビルドできる
- OpenSCAD WASM がリポジトリ内に同梱されている
- 最小 SCAD の OFF / STL / 3MF PoC が実装されている

## Checkpoint B: 出力戦略

- Bambu Studio 確認チェックリストが用意されている
- body / legend 別体積方式を安全側の正式候補として文書化している
- preview と export の責務分離が文書とコードの両方で説明できる

## Checkpoint C: 本実装基盤

- `scad/base/keycap.scad` をエントリに body / legend を切り分けられる
- UI から主要パラメータを編集できる
- OFF を使った preview 経路が存在する

## Checkpoint D: 配信と運用

- GitHub Pages ワークフローが存在する
- 運用文書に「拡張時の更新先」と「人間確認が必要な事項」が書かれている
- README から主手順書、補助資料、チェックリストに辿れる
