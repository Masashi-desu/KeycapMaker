# 自動テスト

品質gateと変更分類の正本は [CONTRIBUTING.md](../../CONTRIBUTING.md) です。

## 実行

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run lint:workflows
```

`npm test` は `test/*.test.js` のNode testだけを実行します。純粋関数、import/export形式、SCAD bridge、実WASMでのgeometry、文書、変更分類を担当します。`test/support/scad-context.js` はSCAD testのbrowser mockとVite SSR環境を用意し、各caseの終了時にmodule cacheとglobalを片付けます。テスト間で可変状態を共有しません。

`npm run test:browser` は `test/e2e/*.spec.js` のPlaywright testを実行します。各caseで新しいbrowser contextを使い、専用の `127.0.0.1:4175` のVite serverを起動・終了します。同じportにある既存serverは再利用しません。通常のbrowser profile、window、download folderを使いません。外部CDNを遮断し、同梱font、icon fallback、OpenSCAD worker/WASMをローカル配信します。

CIはrequired test jobでNode/browser testとworkflow lintを実行します。ChromiumとLinux用system dependencyは `npx playwright install --with-deps chromium` で導入します。失敗時のscreenshotとtraceは `.tmp/playwright-results/` に保存します。ローカルのtraceは `npx playwright show-trace <trace.zipのパス>` で確認できます。

## Page Object Model

UIの構造と操作は `test/e2e/pages/` に集約します。

- `EditorPage`: 初期表示、デザイン名・寸法の編集、デザインtabへの移動
- `ProjectPanel`: project tab、キーの追加・選択、export dialogを開く操作
- `ExportDialog`: 書き出し操作とdownloadの取得

`fixtures.js` がcontextとPage Objectを用意し、specはユーザー操作と期待結果を記述します。selectorはPage Objectに閉じ込め、`expect` はspecに置きます。複数ページに共通する処理がない段階ではBase Pageを追加しません。新しいUI flowも必要な画面・componentに操作を追加し、巨大なPage Objectに全機能を集めません。

現行のbrowser testは、UI編集値のJSON書き出し、project内のキー切り替えによる編集値保持、WebMCPとUIの双方向同期・不正な部分更新の拒否・実worker/WASMでのpreview完了を確認します。WebMCPの登録APIだけをmockし、toolの実行には実アプリのcommandを使います。ネイティブWebMCP APIの互換性、全export形式、全shapeのgeometry、モバイルの目視品質を保証するtestではありません。環境固有の確認は [手動確認](manual-verification.md) と [WebMCPガイド](webmcp.md) を参照します。

## 重複を増やさない方針

境界値や互換入力はNode testに置き、browser testは代表flowの連携を確認します。同じ入力の準備・生成を繰り返すcaseはfixtureまたはtableにまとめます。入力正規化、SCAD parameter mapping、生成後のmeshは異なる責務なので、同じ値を使っていても各層の検証を残します。caseを統合する際は、独自のassertionとfailure診断を失わないことを確認します。

設計の参考: [依頼されたPOM解説記事](https://qa-auto-lab.com/2026/04/04/page-object-model-jp/)、[Playwright公式Page Object Models](https://playwright.dev/docs/pom)。
