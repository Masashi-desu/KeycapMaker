# エージェントからKeycapMakerを操作する

WebMCP対応ブラウザ・拡張のエージェントでKeycapMakerを開くと `keycap_` で始まるtoolを利用できます。GitHub PagesのHTTPS、または開発用localhostで使用します。WebMCPは開発中のAPIなので、ブラウザごとの対応・実験機能設定は [Chrome公式案内](https://developer.chrome.com/docs/ai/webmcp) を確認してください。KeycapMakerの変更だけで任意のMCPクライアントから接続できるようになるわけではありません。

## 基本的な操作順

1. `keycap_get_state({})` で現在の編集内容とproject keycap IDを読む。
2. `keycap_get_catalog({ section: "shapes" })`、`keycap_get_catalog({ section: "fields" })` でshapeとパラメータを調べる。fontは `section: "fonts"`、iconは `section: "icons", query: "volume"` で検索する。
3. `keycap_update({ params: { name: "Esc", keyWidth: 18, legendEnabled: true, legendText: "Esc" } })` でactive keycapを編集する。単位はmm。
4. `keycap_preview({ mode: "keycap" })` で生成と描画完了を確認する。
5. `keycap_export({ format: "3mf" })` でdownloadを開始する。編集再開用JSONは `format: "editor-data"`、全projectは `format: "project-zip"`。ZIPはルートにKeycapMaker.json、keycaps/<キーキャップ名>/にJSON・preview・個別3MFを格納し、配置済みキーがあればcommon/keyboard.3mfも含む。旧構成のZIPは従来どおりUIから読み込める。

配置したキーを並んだ状態で印刷する場合は、`keycap_export({ format: "keyboard-3mf" })` を使います。割り当て済みキーだけを開始時のproject snapshotから出力し、構造から確定したグループごとにスライサで動かせる親objectを作ります。`keycap_get_state` の `project.keyboard.groups` と各キーの `groupId` で所属を確認できます。`groupId: null` は所属不明で、出力でも各キーを個別objectにします。色と部品分離を保持し、プリンタのベースプレートへの配置調整はスライサで行います。配置がない場合は `export_failed` を返します。

追加は `keycap_project({ action: "add" })`、切替は `keycap_project({ action: "select", keycapId })`。keyboardのJSON定義を `keycap_set_keyboard({ layout })` へ渡し、state内のslot IDを `keycap_assign({ slotId, keycapId })` で割り当てます。削除・board置換・downloadはユーザーの依頼範囲を確認して実行します。

キーボード配置全体の削除はUI専用です。配置パネルの初期状態で閉じた `危険ゾーン` を開いて削除を選び、配置名と割り当て数が表示される確認ダイアログで承認します。キーキャップのデザインは残ります。プレビュー切り替えは画面下のセグメントコントロールと `keycap_set_view`、配置と書き出しは既存の `keycap_assign` / `keycap_export` を使います。

boardがある場合、`keycap_set_view({ tab: "design" })` で設計へ移動すると単体表示、`{ tab: "keyboard" }` で配置へ移動すると全体表示を選びます。その後の手動切り替えは保持し、同じtabの再指定やprojectへの移動では変えません。tabとpreviewModeを同時に指定した場合はpreviewModeを優先します。

配置位置のXY / 高さ / 回転補正はUI専用です。配置パネルの `この位置のキーキャップ` カード内で調整し、同じカードの `このキーキャップを編集` から割り当て済みデザインを開けます。補正はその配置位置だけに適用します。

`ok` と `error.code` を毎回確認します。`busy` は状態を読み、先行処理の完了後に再試行します。`invalid_input` はcatalogを取り直して訂正します。成功結果のobservedParamsには正規化後の実値が入ります。UI編集とも共有されるので、toolの連続実行でもstateを取り直してください。

fieldsの結果を短くしたい場合は `keycap_get_catalog({ section: "fields", keys: ["keyWidth", "legendText"] })` のように項目を指定するか、`query: "legend"` でkey/labelを絞り込めます。

## 再入力と一括配置

契約version 2では、状態確認は `get_state.observedParams`、再入力は `get_input` に分けています。observedParamsには派生値があるためimport/updateへコピーしません。`keycap_get_input({})` の `data.keycaps[0].updateParams` は現在有効なUI編集項目だけで、そのままupdateへ渡せます。隠れた設定も含めた複製には同じ結果の `editorPayload` を使います。全デザインを取得する場合は、stateのkeycap ID一覧を `keycap_get_input({ keycapIds })` に渡します。最大256個ずつ取得できます。

複数キーを作成して配置する場合は、次の1回のbatchで処理できます。slotIdは読み込んだboardのstateから取得します。

```js
keycap_batch({
  keycaps: [
    { ref: "a", params: { shapeProfile: "custom-shell", name: "A", legendEnabled: true, legendText: "A" } },
    { ref: "shift", params: { shapeProfile: "custom-shell", name: "Shift", keyWidth: 27, legendEnabled: true, legendText: "Shift" } }
  ],
  assignments: [
    { slotId: "key-0", keycapRef: "a" },
    { slotId: "key-1", keycapRef: "shift" },
    { slotId: "key-2", keycapRef: "shift" }
  ]
});
keycap_preview({ mode: "keyboard", timeoutMs: 120000 });
```

既存キーを元にする場合は新規keycapへbaseKeycapIdとparamsを渡し、完全複製にはpayload: editorPayloadを渡します。割り当てだけならassignmentsだけを送り、keycapIdで既存キーを参照します。ID/refを省略したassignmentは解除です。batchはactive選択や既存補正を維持し、失敗時は全件を反映しません。結果のcreatedでrefと実際のkeycapIdの対応、stateで適用内容を確認します。

全体プレビューの表示完了は `preview.display` で判断します。成功結果のstatus: ready、mode: keyboard、rendered: trueに加えて、assignedCountとrenderedAssignedCountが一致することを確認できます。get_stateで生成途中のrunningも取得できます。activeキーだけの `preview.geometry.status: success` は全体表示の完了を意味しません。UI操作で古くなった表示はstale、待機中の対象変更はpreview_superseded、生成・描画失敗はpreview_failed、待機期限はpreview_timeoutです。期限切れ・キャンセル後も共有workerは継続する場合があります。

JSONファイルの互換importには `keycap_import_editor` を使い、data.importBindingReportも確認します。`webmcp-editor.json` はその内部の名前です。観測値を元のpayloadへ混ぜると、編集項目として受け付けない値が「JSON 読み込みレポート」に出ます。get_inputが返すcanonicalなeditorPayloadには派生値を含めません。ローカルfontを使うデザイン等の完全な保管には従来のproject ZIPを使います。

## 開発者による実ブラウザ確認

以下は現在の標準APIを備えるブラウザでのDevTools用の例です。標準APIの名前をアプリ独自APIで置き換えないでください。

```js
const context = document.modelContext;
if (!context?.getTools || !context?.executeTool) {
  throw new Error("このブラウザではWebMCPのconsumer APIが利用できません。");
}
const tools = await context.getTools();
const tool = tools.find((entry) => entry.name === "keycap_get_state");
const result = JSON.parse(await context.executeTool(tool, {}));
console.log(result);
```

登録だけを提供する初期ブラウザではエージェントまたはそのブラウザ用の検証機能から実行します。`getTools` / `executeTool` はKeycapMakerの登録に必須ではありません。toolがない場合はsecure context、ブラウザの対応、registration warningを確認します。

## 回帰確認

自動gateは `npm test`、`npm run build` と [共通規約](../../CONTRIBUTING.md) のgateを実施します。実ブラウザはユーザーの通常セッションから隔離し、必要な変更範囲について以下を確認します。

- APIのないブラウザでも初期表示、preview、通常編集が動く。
- 操作契約に記載されたtoolが対応APIへ登録され、HMR後に重複せず再登録される。
- 全shapeのfieldsが登録schemaに含まれ、font/icon catalogを取得できる。
- updateしたparamsがUIとproject JSONへ反映される。UIで同じ値を入力した結果とも比較する。
- shape＋依存寸法、surface＋dish、font＋style、icon set＋name、個別corner radiusをまとめて更新できる。
- 不正な値やID、最後のkeycapの削除、keyboardなしのkeyboard previewを拒否し、無効なpatchで一部の値だけ変更されない。
- projectの追加・選択・並べ替え・削除・rename、editor JSONのimport、keyboardの読込・割当・解除を確認する。
- get_inputのupdateParamsを再適用し、editorPayloadを複製して未反映項目が出ないこと、batchで異なるデザインを一括作成・共有割当できること、末尾に不正なslotがあっても全件拒否されることを確認する。
- 全体previewのreadyとcanvasフレーム、割り当て数と描画数の一致を取得し、生成途中のstateも読めることを確認する。preview生成を待ってmesh件数を取得し、exportの生成失敗が `ok: false` になる。JSON/3MF/STEP/STL/ZIPのdownload内容とfilenameを確認する。
- 長時間tool実行中は別の変更toolが `busy` となり、state取得は継続できる。キャンセル後に不要なdownloadが始まらない。
- preview生成中にUIから編集した場合は `preview_superseded` を返し、変更前のmeshを変更後paramsの生成結果として成功扱いしない。

API mockを注入したheadless確認はアプリ側の接続とschemaを検証します。ネイティブブラウザAPIによる発見・実行を検証したこととは区別して結果を記録します。現行契約の詳細は [WebMCP操作契約](../architecture/webmcp.md) を参照してください。
