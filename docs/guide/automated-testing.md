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

`npm test` は `test/` 以下の `*.test.js` をすべて実行します。Node testは純粋関数、import/export形式、SCAD bridge、実WASMでのgeometry、文書、変更分類を担当します。`test/support/scad-context.js` はSCAD testのbrowser mockとVite SSR環境を用意し、各caseの終了時にmodule cacheとglobalを片付けます。テスト間で可変状態を共有しません。

[theme policy test](../../test/theme-policy.test.js) は `src/theme.css` のlight / darkのtoken集合・参照を照合し、他の部品CSSへの固定色の混入やpalette tokenの再定義を検出します。両テーマの実際の表示、hover時の文字と背景のコントラスト、テーマ切り替えによる製造色の保持はbrowser testで確認します。固定色チェックの対象はUI stylesheetであり、3D材質やユーザーの製造色データを検査・変更しません。

`npm run test:browser` は `test/e2e/` 以下の `*.spec.js` のPlaywright testを実行します。suiteの開始・終了時に専用の `127.0.0.1:4175` のVite serverを起動・終了し、各caseではPlaywrightのfixtureが新しいbrowser contextを用意します。同じportにある既存serverは再利用しません。他の作業とportが重なる場合は `KEYCAP_BROWSER_TEST_PORT=4185 npm run test:browser` のように空いているportを指定します。通信の許可先も設定されたapp originへ追従します。通常のbrowser profile、window、download folderを使いません。外部CDNを遮断し、同梱font、icon fallback、OpenSCAD worker/WASMをローカル配信します。

## スコープ別の実行と結果

[スコープ一覧](../../test/regression-scopes.json) がNodeのテストファイル、Playwrightのproject、CIのjobの対応を定義します。複数の機能が関わる場合は、ケースが最後に保証したい振る舞いで所属を決めます。たとえば、WebMCPから保存しても同意画面の挙動を確認するケースは `export` に置きます。

| スコープ | 主に検証する振る舞い |
| --- | --- |
| `editor` | 編集データ、フォント・アイコン、印字位置の切り替え、テーマの可読性、JSON読み込みレポート |
| `project` | キーごとの編集値の保持、一括割り当ての参照・重複・補正、旧ZIPの読み込み、同名キーの保存先、commonの3MFと単独出力の一致、ZIP・ディレクトリからの復元 |
| `keyboard` | 配置の読み込み・分割所属・割り当て・補正・削除、配置済みキーの3MF出力 |
| `export` | 個別キーの出力形式と内容、全形式の保存前の同意・拒否、同意中の中断と再実行、使用中の印字に応じた帰属表示、両テーマとモバイルの同意画面 |
| `preview` | 全割り当ての描画完了、部分表示の失敗、表示切り替え時の旧要求の中断、待機の期限・キャンセル、シーンとサムネイル |
| `geometry` | SCADへのパラメーター受け渡し、実WASMの形状、ステム参照形状 |
| `webmcp` | ツールの公開契約・排他・入力検証、UIとの双方向同期、再入力データの再適用と複製、一括作成・共有割り当てと不正な一括更新の全件拒否 |
| `repository` | 文書・同梱資源・変更分類、テストファイルのスコープ登録 |

たとえば、プロジェクトの保存・復元に関する回帰は次のように確認できます。

```sh
npm run test:scope -- project
```

最後に `[project] Node: PASS`、`[project] Playwright: PASS` の形式で各層の合否が出ます。どちらかが失敗すると終了コードは非ゼロです。ブラウザケースを持たない `geometry` と `repository` はNodeのみ実行します。ブラウザ層のケース一覧と個別実行には次のコマンドを使います。

```sh
npm run test:browser -- --project=project --list
npm run test:browser -- --project=project
```

CIの `Regression / <scope>` で各スコープの結果と失敗したケースを確認できます。他のスコープが失敗しても各jobは最後まで実行し、全スコープが成功した場合にbuildへ進みます。ブラウザケースのあるjobは `npx playwright install --with-deps chromium` でChromiumを導入し、`repository` はworkflow lintも実行します。

ローカルの失敗時のスクリーンショット・traceと、ケースが保存する比較用PNG・3MFは `.tmp/playwright-results/<scope>/` に出力します。traceは `npx playwright show-trace <trace.zipのパス>` で確認できます。

## Page Object Model

UIの構造と操作は `test/e2e/pages/` に集約します。

- `EditorPage`: 初期表示、デザイン名・寸法の編集、設計項目の見出しアイコンの取得、印字位置の選択と表示中の印字の編集、デザインtabへの移動、テーマ切り替えと入力欄の配色取得
- `ProjectPanel`: project tab、キーの追加・選択、export dialogを開く操作、project ZIPの保存とZIP・ディレクトリ・ファイル一覧dropの読み込み
- `ExportDialog`: 書き出し操作、共通の同意画面を通したdownloadの取得
- `DownloadConsent`: 同意checkbox・確認ボタン・帰属コピー・キャンセル・Esc、両テーマの配色とmobileのレイアウト確認
- `KeyboardPanel`: 配置ファイルの読み込み、配置先の選択・割り当て・位置補正・割り当て済みキーキャップの編集、分割所属の表示、配置全体の3MF download、危険ゾーンの展開・削除確認・キャンセル
- `PreviewStage`: 表示モードの切り替え、プレビューの要求番号と描画状態の取得・完了待ち、canvasフレームの取得。プロジェクトの読み込みもこのcomponentで次の描画完了を待つ
- `ImportBindingNotice`: JSONの未反映項目・値、開閉・項目削除、両テーマの文字と背景のコントラスト確認

`fixtures.js` がcontextとPage Objectを用意し、specはユーザー操作と期待結果を記述します。selectorはPage Objectに閉じ込め、`expect` はspecに置きます。複数ページに共通する処理がない段階ではBase Pageを追加しません。新しいUI flowも必要な画面・componentに操作を追加し、巨大なPage Objectに全機能を集めません。

WebMCPのbrowser testは登録APIをmockし、実アプリのcommandとPOMが取得するUI・保存結果を照合します。プレビューには実worker/WASMを使い、失敗時の表示を確認するケースだけで配信エラーを再現します。ディレクトリdropはOSのfile handle境界を模擬し、実importerで階層をたどります。ネイティブWebMCP APIの互換性や実機の目視確認は [手動確認](manual-verification.md) と [WebMCPガイド](webmcp.md) を参照してください。

## テストを追加・変更する手順

1. 変更した責務と期待結果を確認する。純粋関数、境界値、データ形式、geometryは `test/*.test.js`、ユーザー操作からUIや保存結果への連携は `test/e2e/` 以下のspecで確認する。Node testの共通準備は `test/support/` を使う
2. UI testでは [既存spec](../../test/e2e/editor.spec.js) と [Page Object](../../test/e2e/pages/editor-page.js) を確認し、必要な操作があれば再利用する。追加するlocatorはPage Objectのconstructorまたはcomponentの要素取得メソッドに置く。利用者の操作を表すメソッドへ、展開・入力・遷移・完了待ちをまとめる
3. 別の画面・componentを扱う場合は `test/e2e/pages/` に責務を分け、親Page Objectから組み合わせる。新たな初期化・mockが必要な場合は [fixtures.js](../../test/e2e/fixtures.js) またはsupportへ追加する。specごとにbrowserを起動したり、既存の通常profileを使ったりしない
4. specは `fixtures.js` から `test` / `expect` をimportし、POMの操作と期待結果を書く。状態の検証は公開locatorへの `await expect(...)`、download / tool結果などの戻り値へのassertionを使う。selectorやDOM操作をspecへ追加しない
5. UIとWebMCPの同期を変更した場合は `webMcp` fixtureを使い、実commandの結果とPOMが示すUI・保存結果を照合する。登録APIのmock実装は [WebMcpClientのsupport](../../test/e2e/support/webmcp-client.js) に集約する。アプリ内部stateの直接変更でユーザー操作を省略しない
6. UI構造を変更した場合は対応するPOMを同じ変更で更新する。テストの重複を整理する場合は統合前のcase・入力・assertionを照合し、独自の回帰検証と失敗時の診断を残す。実行対象をconfigのglobから外したり、skipで失敗を隠したりしない
7. ファイルの追加・移動時はスコープ一覧の `node`（`test/` 基準）または `browser`（`test/e2e/` 基準）へ登録する。登録漏れ・重複・存在しないファイルは `repository` のテストで検出する
8. 対象スコープを単独実行し、最後にCONTRIBUTING.mdの変更classに必要なgateを通す。単一specは `npm run test:browser -- test/e2e/editor.spec.js` で実行する。文書だけの変更は `npm run test:docs` を使う

追加・査読時は、操作がPOMにまとまっていること、assertionがspecにあること、caseが前のcaseのstateに依存しないこと、UIとWebMCPの入口を適切に使っていること、gateとガイドの説明が実装に一致することを確認します。

## 重複を増やさない方針

境界値や互換入力はNode testに置き、browser testは代表flowの連携を確認します。同じ入力の準備・生成を繰り返すcaseはfixtureまたはtableにまとめます。入力正規化、SCAD parameter mapping、生成後のmeshは異なる責務なので、同じ値を使っていても各層の検証を残します。caseを統合する際は、独自のassertionとfailure診断を失わないことを確認します。

設計の参考: [POM解説記事](https://qa-auto-lab.com/2026/04/04/page-object-model-jp/)、[Playwright公式Page Object Models](https://playwright.dev/docs/pom)。
