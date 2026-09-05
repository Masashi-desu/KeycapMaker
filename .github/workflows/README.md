# GitHub Actions

`deploy-pages.yml` は、push差分の分類、必要な検証、Pages artifact build、公開branchへのdeployを一つの依存graphとして所有します。branch運用と品質gateの正本は [開発・貢献規約](../../CONTRIBUTING.md) です。

## Job responsibilities

- `Classify changes`: `.github/change-policy.json` とpackage/lockfileのsemantic diffから最強classを出力する
- `Validate documentation`: repository documentationだけのpushで `npm run test:docs` を実行する
- `Run required tests`: validation/artifact changeで `npm test` とactionlintを実行する
- `Build Pages artifact`: artifact changeかつtest成功時だけVite buildとartifact uploadを実行する
- `Deploy GitHub Pages`: build成功後、`main` pushまたは明示的manual runだけdeployする

metadata-only changeと、専用workflow所有として設定した資源では、分類以外のjobをskipします。manual runは全test、build、deployを要求します。

## Permissions and versions

workflow-level permissionsは空です。checkoutを行うjobだけ `contents: read`、deploy jobだけ `pages: write` と `id-token: write` を持ちます。

JavaScript Actionは公式stable releaseのcommit SHAへ固定し、Node.js 24 runtime版を使います。workflow lintは公式 `rhysd/actionlint:1.7.12` containerへ固定しています。versionとlicense一覧は [第三者コンポーネントとライセンス](../../docs/third-party-licenses.md) を参照してください。
