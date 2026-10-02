# WebMCP 操作契約

KeycapMakerはブラウザ内のアプリ操作をWebMCPのimperative APIで公開します。サーバー、MCP用バックエンド、追加SDK、外部へのstate送信は導入しません。契約versionは `1` です。

## 責務と登録

- `src/lib/webmcp.js`: ツール名、説明、JSON Schema、入力検証、結果形式、変更操作の排他、ブラウザAPIの互換処理
- `src/main.js`: UIフィールドからcatalog / parameter schemaを生成し、既存のproject、import、preview、export処理へ接続するcommand adapter
- `applyEditorFieldValue`: UIとWebMCPで共有する編集処理。shape切替の初期値、stem適合値、表面形状preset、corner radius、icon fill、派生値を同じルールで更新する
- `test/webmcp.test.js`: 公開契約、入力検証、排他、キャンセル、未対応環境、登録失敗と解除の回帰test

`document.modelContext.registerTool(tool, { signal })` を優先し、初期origin trial向けに `navigator.modelContext` もfeature detectionします。APIがない環境では登録を省略して通常UIを継続します。初回描画時に登録し、load時に未対応だった場合だけ再確認します。Vite HMR時は登録用AbortControllerで自分のtoolを解除します。初期APIの `unregisterTool` が存在するときは自分のtool名だけを解除します。登録途中の失敗は自分の登録を取り消してconsoleへ記録します。`provideContext` / `clearContext` による他toolの置換は行いません。

新しいoriginへ公開する `exposedTo` は指定しません。これはページ内toolであり、通常のMCPクライアントへ接続するHTTP/stdioサーバーではありません。エージェント側に対応ブラウザまたはブラウザ拡張が必要です。未対応環境へ独自のglobal APIを注入するpolyfillは配信しません。

## ツール一覧

| 名前 | 入力・結果 |
| --- | --- |
| `keycap_get_state` | 引数 `{}`。編集中params、preview/export状態、project名、keycap ID一覧、keyboardとplacements、未割当import項目を返す |
| `keycap_get_catalog` | `section`: `shapes` / `fields` / `fonts` / `icons`。fieldsは任意の `shapeProfile` と `keys`（1〜32個）または `query` で絞り込める。font/icon検索は `query` と `limit`（1〜100）、iconは `iconSet` を指定できる |
| `keycap_update` | `params` に部分更新を渡す。指定しない値を維持し、active project entryとUIを同期して実際のstateを返す |
| `keycap_project` | `action`: `add` / `select` / `delete` / `rename` / `move`。select/delete/moveは `keycapId`、renameは `name`、moveは `offset` が必要。最後のkeycapは削除不可 |
| `keycap_import_editor` | `payload` にcanonicalまたはsparse互換editor JSONを渡す。ファイルdropと同じimporterで新しいproject keycapを追加する |
| `keycap_set_keyboard` | `layout` にKLE / QMK / VIA / Vial / KeycapMakerのJSON objectまたはarray、必要なら0始まりの `layoutIndex` を渡す。boardを置換し旧placementsを解除する |
| `keycap_assign` | `slotId` と任意の `keycapId`。keycapId省略で割り当て解除 |
| `keycap_set_view` | `tab`: `design` / `project` / `keyboard`、または `previewMode`: `keycap` / `keyboard`。keyboard previewにはboardが必要 |
| `keycap_preview` | 引数 `{}`。active keycapの生成完了を待ち、メッシュ件数を含むstateを返す |
| `keycap_export` | `format`: `editor-data` / `3mf` / `step` / `stl` / `project-zip`。生成とdownload開始後、filename、byteLength、stateを返す |

shape固有フィールド、font style、iconはcatalogから現在の値と選択肢を確認して指定します。field catalogはkey、typeを含むschema、label、説明、単位、value、UIのvisible/disabledを返します。表示条件によって隠れた設定も事前編集できます。UIのu補助入力と基準幅のブラウザ設定はmmによる編集と重なるブラウザ設定なのでtoolに含めず、長さはmm、角度はdegreeで指定します。

現時点の公開対象外は、視覚的な調整が中心のpreview camera、一時的なtheme/locale設定、ファイル権限とbinary入力を伴うローカルfont・project ZIPのimport、元資源の選択UIを伴うGitHub探索です。既存UIから利用し、agentが取得したkeyboard定義のJSONは `keycap_set_keyboard` へ渡せます。placementの個別offset/回転補正とboard削除は専用UI操作を維持しており、現行toolは既存補正値を保つ割り当て/解除を公開します。これらをtoolへ追加するときも既存UIの処理を共通化します。

## 編集と結果の契約

登録時のparameter schemaは全shapeのUIフィールド定義を集約して生成します。shapeやfontで変わる制約・enumを固定しません。実行時はdraftに対して現在のフィールド制約と選択肢を検証します。shape、主要寸法、制御値を依存値より先に適用します。未知のkey、型違い、非有限number、長すぎるtext、不正な色、存在しないshape/font/icon/IDは失敗を返します。部分編集は全項目をdraft上で処理し、成功時だけstateを置換するので途中で失敗しても一部だけ反映しません。既存の派生値・寸法正規化は保持し、結果のparamsを実際の適用値として扱います。

成功は `{ ok: true, contractVersion: 1, data }`、失敗は `{ ok: false, contractVersion: 1, error: { code, message } }` です。主なcodeは `invalid_input`、`not_found`、`busy`、`preview_failed`、`export_failed`、`operation_failed`。DOM要素、関数、mesh本体、画像data URLを返しません。ユーザー名やimport内の文面はdataとして扱います。読み取りtoolに `readOnlyHint`、ユーザー由来の結果に `untrustedContentHint`、削除・置換・downloadを含むtoolに `consequentialHint` を付けます。

toolによる変更操作は排他で、先行toolやUIのexport / project保存 / keyboard読込が実行中なら `busy` を返します。読み取りは実行中も利用できます。UIでの通常編集は継続できます。previewはrequest IDで古い結果を破棄し、tool完了時にも開始時のparamsとactive keycapが一致することを確認します。UI編集によって対象が変わった場合は `preview_failed` を返します。exportは呼び出し時のparams、project ZIPは保存開始時のproject snapshotを使います。保存中の追加編集はdirty状態を維持します。updateはpreviewを予約するため、その結果を待つには `keycap_preview` を呼びます。

ブラウザが実行用AbortSignalを提供する場合は開始前と長時間処理後、download直前に確認し、project ZIPでは各keycapの生成前にも確認します。進行中のOpenSCAD workerジョブの強制停止や、すでに反映した編集・import・downloadの巻き戻しは保証しません。export成功は生成とdownload開始の成功であり、ブラウザの保存完了やローカルファイルpathを保証しません。STEP/STLの単色・legend省略契約は従来どおりです。

## 参照・保守

APIの基準は2026-09-30版 [WebMCP公式ドラフト](https://webmachinelearning.github.io/webmcp/)。ブラウザ実装の確認は [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) を参照します。ドラフトの変更時はcompatibility adapterとregistration testを同時に更新します。

機能追加時の義務は [CONTRIBUTING.md](../../CONTRIBUTING.md)、利用例と実環境確認は [WebMCPガイド](../guide/webmcp.md) を正とします。
