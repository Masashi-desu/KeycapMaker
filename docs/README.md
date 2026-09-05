# docs ディレクトリ案内

`docs/` は、現在の実装を保守・拡張するための文書群です。現行仕様、手動確認手順、歴史的判断、未解決のTODOを分けています。開発・貢献規約の正本はrootの [CONTRIBUTING.md](../CONTRIBUTING.md) です。

## サブディレクトリの役割

- `architecture/`: アプリ構成、SCAD / export 契約、実装上の前提
- `guide/`: 手動確認手順と個別の運用ガイド
- `decisions/`: 採用済みの判断を時系列で残す記録
- `reference/`: 用語や短い参照資料
- `backlog/`: 未着手または継続検討中の拡張 TODO
- `design/`: 過去のPencil `.pen` とrenderを保持する歴史資料
- `third-party-licenses.md`: 配信資源、npm依存、CDN、font、CI toolのライセンス一覧

## 推奨読書順

1. [architecture/overview.md](architecture/overview.md)
2. [architecture/scad-and-export.md](architecture/scad-and-export.md)
3. [architecture/project-data.md](architecture/project-data.md)
4. [CONTRIBUTING.md](../CONTRIBUTING.md)
5. [guide/manual-verification.md](guide/manual-verification.md)
6. [third-party-licenses.md](third-party-licenses.md)
7. [decisions/decision-log.md](decisions/decision-log.md)
8. 必要に応じて `backlog/` と `design/`

## 運用ルール

- 開発、branch、品質gate、release、生成物、同期規則は [CONTRIBUTING.md](../CONTRIBUTING.md) を正本とする
- 構成や責務が変わったら `architecture/` と対応testを更新する
- 日常運用や確認手順が変わったら `guide/`、npm script、workflowを同期する
- 採用した判断は [decisions/decision-log.md](decisions/decision-log.md) に残す
- 将来の拡張案や未解決事項は `backlog/` に寄せる
- 第三者資源を変えたら [third-party-licenses.md](third-party-licenses.md) とnotice/provenanceを同期する
- `design/` は歴史的なPencil sourceであり、現行behaviorは実装・test・architectureを正とする

## 参照資料

- [reference/j-stem-lp01-dimensions.md](reference/j-stem-lp01-dimensions.md): J-STEM-LP01 図面寸法と SCAD パラメータの対応表
