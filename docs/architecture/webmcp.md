# WebMCP 操作契約

KeycapMakerはブラウザ内のアプリ操作をWebMCPのimperative APIで公開します。サーバー、MCP用バックエンド、追加SDK、外部へのstate送信は導入しません。契約versionは `2` です。

## 責務と登録

- `src/lib/webmcp.js`: ツール名、説明、JSON Schema、入力検証、結果形式、変更操作の排他、ブラウザAPIの互換処理
- `src/main.js`: UIフィールドからcatalog / parameter schemaを生成し、既存のproject、import、preview、export処理へ接続するcommand adapter
- `applyEditorFieldValue`: UIとWebMCPで共有する編集処理。shape切替の初期値、stem適合値、表面形状preset、corner radius、icon fill、派生値を同じルールで更新する
- `src/lib/project-batch.js`: 一括proposalの検証とUI / tool共通のplacement更新
- `src/lib/preview-completion.js`: AbortSignalと期限を伴う描画完了待機
- `test/webmcp.test.js`: 公開契約、入力検証、排他、キャンセル、未対応環境、登録失敗と解除の回帰test

`document.modelContext.registerTool(tool, { signal })` を優先し、初期origin trial向けに `navigator.modelContext` もfeature detectionします。APIがない環境では登録を省略して通常UIを継続します。初回描画時に登録し、load時に未対応だった場合だけ再確認します。Vite HMR時は登録用AbortControllerで自分のtoolを解除します。初期APIの `unregisterTool` が存在するときは自分のtool名だけを解除します。登録途中の失敗は自分の登録を取り消してconsoleへ記録します。`provideContext` / `clearContext` による他toolの置換は行いません。

新しいoriginへ公開する `exposedTo` は指定しません。これはページ内toolであり、通常のMCPクライアントへ接続するHTTP/stdioサーバーではありません。エージェント側に対応ブラウザまたはブラウザ拡張が必要です。未対応環境へ独自のglobal APIを注入するpolyfillは配信しません。

## ツール一覧

| 名前 | 入力・結果 |
| --- | --- |
| `keycap_get_state` | 引数 `{}`。観測専用の `observedParams`、`preview.geometry` と `preview.display`、export状態、project名、keycap ID一覧、keyboard（groupsと各キーのgroupIdを含む）とplacements、未割当import項目を返す。nullのgroupIdは所属不明 |
| `keycap_get_input` | 任意の `keycapIds`（1〜256個、省略時はactive）。選択を変えず、各キーの `keycapId`、`updateParams`、現行schemaのcanonicalな `editorPayload` を返す |
| `keycap_get_catalog` | `section`: `shapes` / `fields` / `fonts` / `icons`。fieldsは任意の `shapeProfile` と `keys`（1〜32個）または `query` で絞り込める。font/icon検索は `query` と `limit`（1〜100）、iconは `iconSet` を指定できる |
| `keycap_update` | `params` に部分更新を渡す。指定しない値を維持し、active project entryとUIを同期して実際のstateを返す |
| `keycap_project` | `action`: `add` / `select` / `delete` / `rename` / `move`。select/delete/moveは `keycapId`、renameは `name`、moveは `offset` が必要。最後のkeycapは削除不可 |
| `keycap_import_editor` | `payload` にcanonicalまたはsparse互換editor JSONを渡す。ファイルdropと同じimporterで新しいproject keycapを追加する |
| `keycap_set_keyboard` | `layout` にKLE / QMK / VIA / Vial / KeycapMakerのJSON objectまたはarray、必要なら0始まりの `layoutIndex` を渡す。boardを置換し旧placementsを解除する |
| `keycap_assign` | `slotId` と任意の `keycapId`。keycapId省略で割り当て解除 |
| `keycap_batch` | `keycaps`（1〜256個）と/または `assignments`（1〜4096個）。新規キーは `ref` と `params` または `payload`、任意の `baseKeycapId`。割り当ては `slotId` と `keycapRef` または既存 `keycapId`、両方省略で解除。`created` のref / keycapId対応、assignedCount / clearedCount、stateを返す |
| `keycap_set_view` | `tab`: `design` / `project` / `keyboard`、または `previewMode`: `keycap` / `keyboard`。boardがある場合、designへの移動でkeycap、keyboardへの移動でkeyboard previewを選ぶ。同じtabの再指定とprojectへの移動は現在表示を保持し、明示したpreviewModeを優先する。keyboard previewにはboardが必要 |
| `keycap_preview` | 任意の `mode`: `keycap` / `keyboard`（省略時は現在表示）、`timeoutMs`: 100〜300000（既定120000）。モデル生成とcanvasフレームの描画完了を待ち、geometryとdisplayを含むstateを返す |
| `keycap_export` | `format`: `editor-data` / `3mf` / `keyboard-3mf` / `step` / `stl` / `project-zip`。生成とdownload開始後、filename、byteLength、stateを返す。keyboard-3mfは配置済みキーを出力し、keyCount / groupCount / unknownCountも返す |

shape固有フィールド、font style、iconはcatalogから現在の値と選択肢を確認して指定します。field catalogはkey、typeを含むschema、label、説明、単位、value、UIのvisible/disabledを返します。表示条件によって隠れた設定も事前編集できます。UIのu補助入力と基準幅のブラウザ設定はmmによる編集と重なるブラウザ設定なのでtoolに含めず、長さはmm、角度はdegreeで指定します。

現時点の公開対象外は、視覚的な調整が中心のpreview camera、一時的なtheme/locale設定、ファイル権限とbinary入力を伴うローカルfont・project ZIPのimport、元資源の選択UIを伴うGitHub探索です。既存UIから利用し、agentが取得したkeyboard定義のJSONは `keycap_set_keyboard` へ渡せます。placementの個別offset/回転補正は視覚的な位置調整として専用UI操作を維持しており、現行toolは既存補正値を保つ割り当て/解除を公開します。board削除は配置名・割り当て数を確認して一括削除するため、初期状態で閉じた配置パネルの危険ゾーンとブラウザ確認ダイアログによるUI経路だけを公開します。カードの開閉は一時的な表示操作なのでtoolを追加しません。これらをtoolへ追加するときも既存UIの処理を共通化します。タブ移動とプレビュー切り替えは既存commandからUIと共通の処理を使い、入力schemaを維持します。

## 編集と結果の契約

配置位置の補正と割り当て済みキーキャップの編集入口は、配置パネルの `この位置のキーキャップ` カード内にまとめます。補正は既存のUI専用操作、編集対象の選択は既存のproject選択処理を維持し、カード配置の変更でtoolやschemaを追加しません。

登録時のparameter schemaは全shapeのUIフィールド定義を集約して生成します。shapeやfontで変わる制約・enumを固定しません。実行時はdraftに対して現在のフィールド制約と選択肢を検証します。shape、主要寸法、制御値を依存値より先に適用します。未知のkey、型違い、非有限number、長すぎるtext、不正な色、存在しないshape/font/icon/IDは失敗を返します。部分編集は全項目をdraft上で処理し、成功時だけstateを置換するので途中で失敗しても一部だけ反映しません。既存の派生値・寸法正規化は保持し、結果のobservedParamsを実際の適用値として扱います。

成功は `{ ok: true, contractVersion: 2, data }`、失敗は `{ ok: false, contractVersion: 2, error: { code, message } }` です。主なcodeは `invalid_input`、`not_found`、`busy`、`preview_failed`、`preview_superseded`、`preview_timeout`、`export_failed`、`operation_failed`。DOM要素、関数、mesh本体、画像data URLを返しません。ユーザー名やimport内の文面はdataとして扱います。読み取りtoolに `readOnlyHint`、ユーザー由来の結果に `untrustedContentHint`、削除・置換・downloadを含むtoolに `consequentialHint` を付けます。

## 観測データと再入力データ

`get_state.observedParams` は現在の実値と計算結果を含む観測専用データです。`stemEnabled` / `topVisibleCenterHeight` のような派生値やshape固有の補助値を、update/import/batchへコピーしません。version 1の `data.params` はversion 2で `data.observedParams` へ移し、previewの旧status / partsは `data.preview.geometry` へ移しています。

`get_input` は同じUI field metadataから現在visibleかつenabledで制約を満たす項目だけを `updateParams` に収め、`keycap_update({ params: updateParams })` へ渡せます。隠れた設定まで完全に複製する場合は `editorPayload` を `keycap_import_editor({ payload: editorPayload })` またはbatchのpayloadへ渡します。editorPayloadは現在の適用値から標準editor-data serializerで作り、派生値や元ファイルの未反映項目を含めません。keycapIdsでproject内の複数デザインを選択せず取得できます。ローカルfontのbinary等を含むproject ZIPの代替ではありません。

## 一括作成と割り当て

batchは全入力の型、shape依存の制約、参照、配置先を検証したproposalを作り、最後のAbortSignal確認後に一度だけ反映します。途中の失敗でデザインや割り当てを部分適用しません。`keycaps` / `assignments` の少なくとも片方が必要で、入力全体は8 MiB以内です。重複ref、重複slotId、存在しないID / ref、paramsとpayloadの同時指定、keycapIdとkeycapRefの同時指定を拒否します。payloadが現行schemaのcanonical editor-dataでない場合や未反映項目がある場合も拒否し、寛容なファイルimportと区別します。

paramsは既定shapeの初期値への部分更新です。shapeProfileを指定するとUIと同じresetを適用します。baseKeycapIdがあれば既存デザインを複製して更新します。payloadとbaseKeycapIdは併用できません。新規キーを複数slotから同じkeycapRefで参照でき、割り当てだけのbatchも使えます。単独UI割り当てと共通のplacement処理で既存XY / 高さ / 回転補正を保持し、active keycapを変えません。新規キーのサムネイルは既存placeholderを使い、モデル生成はプレビュー時に行います。`created` は入力refと新しい永続IDの対応、assignedCount / clearedCountは今回の変更件数です。

## 非同期処理と表示完了

toolによる変更操作は排他で、先行toolやUIのexport / project保存 / keyboard読込が実行中なら `busy` を返します。get_state / get_input / catalogは実行中も利用できます。UIでの通常編集は継続できます。単体exportは呼び出し時のparams、配置全体3MFとproject ZIPは開始時のproject snapshotを使い、保存中の追加編集はdirty状態を維持します。

`preview.geometry` はactive keycapの生成状態で、isCurrentは現在の対象・paramsと生成snapshotの一致を示します。`preview.display` は実際の表示要求の状態で、status（idle / running / ready / empty / error / stale）、requestId、mode、rendered、keyCount、assignedCount、renderedAssignedCount、modelCount、partCount、errorsを返します。keyboard表示では全割り当てのモデルをsnapshotから生成し、共有デザインは一度だけ生成します。初回requestAnimationFrameでThree.jsがcanvasへ描画した後だけreadyにし、対応するDOMのpreview stageにもrequestId / status / renderedとaria-busyを反映します。OSの画面提示やGPUの物理的な走査完了は保証しません。

`keycap_preview({ mode: "keyboard" })` は表示を全体に切り替えて、モデル生成とcanvasフレームを待ちます。全割り当てが描画できて初めて成功し、未割り当てslotはガイド表示のままです。モデル失敗はerror / preview_failed、途中で配置・割り当て・対象params・表示modeが変わるか表示要求が差し替わるとpreview_superseded、待機期限を過ぎるとpreview_timeoutを返します。部分表示が残っても成功扱いしません。読み取り時に現在データと表示snapshotが異なる場合はstale / rendered:falseとして返すため、古いreadyを新しい入力の完了と混同しません。updateは従来どおり生成を予約し、batchは全体表示中なら再描画を予約します。操作結果の成功とプレビューの成功は別です。

ブラウザが実行用AbortSignalを提供する場合は開始前と長時間処理後、download直前に確認し、project ZIPでは各keycapの生成前にも確認します。配置全体3MFでは各配置先とOFF partの生成前後にも確認します。previewのキャンセル・期限切れは待機を終了しますが、UIと共有する生成・描画は継続する場合があります。進行中のOpenSCAD workerジョブの強制停止や、すでに反映した編集・import・downloadの巻き戻しは保証しません。export成功は生成とdownload開始の成功であり、ブラウザの保存完了やローカルファイルpathを保証しません。STEP/STLの単色・legend省略契約は従来どおりです。

## 参照・保守

全体プレビューのモデル生成エラーは、配置ファイルの読み込み結果と別の表示状態で保持します。プレビューが成功しても読み込みエラーを消さず、モデル生成エラーは次の成功した全体プレビューで解消します。

APIの基準は2026-09-30版 [WebMCP公式ドラフト](https://webmachinelearning.github.io/webmcp/)。ブラウザ実装の確認は [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) を参照します。ドラフトの変更時はcompatibility adapterとregistration testを同時に更新します。

機能追加時の義務は [CONTRIBUTING.md](../../CONTRIBUTING.md)、利用例と実環境確認は [WebMCPガイド](../guide/webmcp.md) を正とします。
