# .github/workflows

GitHub Actions と GitHub Pages デプロイ用のワークフローを配置する場所です。

## 今後ここに置くもの

- GitHub Pages へのデプロイワークフロー
- 必要に応じたビルド確認や静的チェック

本リポジトリでは、Task 10 で [deploy-pages.yml](deploy-pages.yml) を追加済みです。

## GitHub Pages デプロイ条件

- `main` ブランチへの push だけで自動デプロイする
- 通常開発は `dev` に集約し、`dev` を `main` へ push / merge したときだけ公開対象にする
- `feat/*` など、`main` 以外のブランチへの push ではデプロイしない
- `docs/` や README など、配信される Web 資源に関係しない変更だけではデプロイしない
- 対象パスは `src/` の実装ファイル、`public/`、`scad/**/*.scad`、`index.html`、Vite / npm 設定に限定する
