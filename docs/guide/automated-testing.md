# 自動テスト

品質gate、変更分類、POMを維持する実装規約の正本は [CONTRIBUTING.md](../../CONTRIBUTING.md) です。このガイドはテストの配置、追加手順、確認方法を補足します。

## 実行

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run lint:workflows
```

`npm test` は `test/*.test.js` のNode testだけを実行します。純粋関数、import/export形式、SCAD bridge、実WASMでのgeometry、文書、変更分類を担当します。`test/support/scad-context.js` はSCAD testのbrowser mockとVite SSR環境を用意し、各caseの終了時にmodule cacheとglobalを片付けます。テスト間で可変状態を共有しません。

[theme policy test](../../test/theme-policy.test.js) は `src/theme.css` のlight / darkのtoken集合・参照を照合し、他の部品CSSへの固定色の混入やpalette tokenの再定義を検出します。両テーマの実際の表示、hover時の文字と背景のコントラスト、テーマ切り替えによる製造色の保持はbrowser testで確認します。固定色チェックの対象はUI stylesheetであり、3D材質やユーザーの製造色データを検査・変更しません。

`npm run test:browser` は `test/e2e/` 以下の `*.spec.js` のPlaywright testを実行します。suiteの開始・終了時に専用の `127.0.0.1:4175` のVite serverを起動・終了し、各caseではPlaywrightのfixtureが新しいbrowser contextを用意します。同じportにある既存serverは再利用しません。他の作業とportが重なる場合は `KEYCAP_BROWSER_TEST_PORT=4185 npm run test:browser` のように空いているportを指定します。通信の許可先も設定されたapp originへ追従します。通常のbrowser profile、window、download folderを使いません。外部CDNを遮断し、同梱font、icon fallback、OpenSCAD worker/WASMをローカル配信します。

CIはrequired test jobでNode/browser testとworkflow lintを実行します。ChromiumとLinux用system dependencyは `npx playwright install --with-deps chromium` で導入します。失敗時のscreenshotとtraceは `.tmp/playwright-results/` に保存します。ローカルのtraceは `npx playwright show-trace <trace.zipのパス>` で確認できます。

## Page Object Model

UIの構造と操作は `test/e2e/pages/` に集約します。

- `EditorPage`: 初期表示、デザイン名・寸法の編集、デザインtabへの移動、テーマ切り替えと入力欄の配色取得、preview stageの要求番号・状態・canvasフレームの取得
- `ProjectPanel`: project tab、キーの追加・選択、export dialogを開く操作
- `ExportDialog`: 書き出し操作とdownloadの取得
- `KeyboardPanel`: 配置ファイルの読み込み、配置先の選択・割り当て・位置補正・割り当て済みキーキャップの編集、分割所属の表示、配置全体の3MF download、危険ゾーンの展開・削除確認・キャンセル、手動プレビュー切り替え
- `ImportBindingNotice`: JSONの未反映項目・値、開閉・項目削除、両テーマの文字と背景のコントラスト確認

`fixtures.js` がcontextとPage Objectを用意し、specはユーザー操作と期待結果を記述します。selectorはPage Objectに閉じ込め、`expect` はspecに置きます。複数ページに共通する処理がない段階ではBase Pageを追加しません。新しいUI flowも必要な画面・componentに操作を追加し、巨大なPage Objectに全機能を集めません。

現行のbrowser testは、UI編集値のJSON書き出し、project内のキー切り替えによる編集値保持、WebMCPとUIの双方向同期・不正な部分更新の拒否・実worker/WASMでのpreview完了、構造からの分割所属と配置全体3MFのUI/WebMCP同期、危険ゾーンの初期折りたたみ・展開状態の保持・配置削除のキャンセルと承認後のデザイン保持、UI/WebMCPのタブ移動時のプレビュー選択と手動切り替えの維持を確認します。WebMCPの登録APIだけをmockし、toolの実行には実アプリのcommandを使います。再入力用データの再適用とcanonical複製、一括作成・共有割当・末尾不正入力の全件拒否、全体previewのcanvas描画完了とUI切り替え時の旧要求拒否、runtime配信失敗時の部分表示を成功扱いしないことも確認します。Node testはbatch proposalの参照・重複・補正保持と待機の期限 / キャンセルを担当します。ネイティブWebMCP APIの互換性、全export形式、全shapeのgeometry、モバイルの目視品質を保証するtestではありません。環境固有の確認は [手動確認](manual-verification.md) と [WebMCPガイド](webmcp.md) を参照します。

## テストを追加・変更する手順

1. 変更した責務と期待結果を確認する。純粋関数、境界値、データ形式、geometryは `test/*.test.js`、ユーザー操作からUIや保存結果への連携は `test/e2e/` 以下のspecで確認する。Node testの共通準備は `test/support/` を使う
2. UI testでは [既存spec](../../test/e2e/editor.spec.js) と [Page Object](../../test/e2e/pages/editor-page.js) を確認し、必要な操作があれば再利用する。追加するlocatorはPage Objectのconstructorまたはcomponentの要素取得メソッドに置く。利用者の操作を表すメソッドへ、展開・入力・遷移・完了待ちをまとめる
3. 別の画面・componentを扱う場合は `test/e2e/pages/` に責務を分け、親Page Objectから組み合わせる。新たな初期化・mockが必要な場合は [fixtures.js](../../test/e2e/fixtures.js) またはsupportへ追加する。specごとにbrowserを起動したり、既存の通常profileを使ったりしない
4. specは `fixtures.js` から `test` / `expect` をimportし、POMの操作と期待結果を書く。状態の検証は公開locatorへの `await expect(...)`、download / tool結果などの戻り値へのassertionを使う。selectorやDOM操作をspecへ追加しない
5. UIとWebMCPの同期を変更した場合は `webMcp` fixtureを使い、実commandの結果とPOMが示すUI・保存結果を照合する。登録APIのmock実装は [WebMcpClientのsupport](../../test/e2e/support/webmcp-client.js) に集約する。アプリ内部stateの直接変更でユーザー操作を省略しない
6. UI構造を変更した場合は対応するPOMを同じ変更で更新する。テストの重複を整理する場合は統合前のcase・入力・assertionを照合し、独自の回帰検証と失敗時の診断を残す。実行対象をconfigのglobから外したり、skipで失敗を隠したりしない
7. 最初に変更したspecを実行して結果を確認し、最後にCONTRIBUTING.mdの変更classに必要なgateを通す。現行ブラウザsuiteは `npm run test:browser`、単一specは `npm run test:browser -- test/e2e/editor.spec.js` で実行する。文書だけの変更は `npm run test:docs` を使う

追加・査読時は、操作がPOMにまとまっていること、assertionがspecにあること、caseが前のcaseのstateに依存しないこと、UIとWebMCPの入口を適切に使っていること、gateとガイドの説明が実装に一致することを確認します。

## 重複を増やさない方針

境界値や互換入力はNode testに置き、browser testは代表flowの連携を確認します。同じ入力の準備・生成を繰り返すcaseはfixtureまたはtableにまとめます。入力正規化、SCAD parameter mapping、生成後のmeshは異なる責務なので、同じ値を使っていても各層の検証を残します。caseを統合する際は、独自のassertionとfailure診断を失わないことを確認します。

設計の参考: [POM解説記事](https://qa-auto-lab.com/2026/04/04/page-object-model-jp/)、[Playwright公式Page Object Models](https://playwright.dev/docs/pom)。
