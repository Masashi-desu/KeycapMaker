# エージェントからKeycapMakerを操作する

WebMCP対応ブラウザ・拡張のエージェントでKeycapMakerを開くと `keycap_` で始まるtoolを利用できます。GitHub PagesのHTTPS、または開発用localhostで使用します。WebMCPは開発中のAPIなので、ブラウザごとの対応・実験機能設定は [Chrome公式案内](https://developer.chrome.com/docs/ai/webmcp) を確認してください。KeycapMakerの変更だけで任意のMCPクライアントから接続できるようになるわけではありません。

## 基本的な操作順

1. `keycap_get_state({})` で現在の編集内容とproject keycap IDを読む。
2. `keycap_get_catalog({ section: "shapes" })`、`keycap_get_catalog({ section: "fields" })` でshapeとパラメータを調べる。fontは `section: "fonts"`、iconは `section: "icons", query: "volume"` で検索する。
3. `keycap_update({ params: { name: "Esc", keyWidth: 18, legendEnabled: true, legendText: "Esc" } })` でactive keycapを編集する。単位はmm。
4. `keycap_preview({})` で生成完了を確認する。
5. `keycap_export({ format: "3mf" })` でdownloadを開始する。編集再開用JSONは `format: "editor-data"`、全projectは `format: "project-zip"`。

追加は `keycap_project({ action: "add" })`、切替は `keycap_project({ action: "select", keycapId })`。keyboardのJSON定義を `keycap_set_keyboard({ layout })` へ渡し、state内のslot IDを `keycap_assign({ slotId, keycapId })` で割り当てます。削除・board置換・downloadはユーザーの依頼範囲を確認して実行します。

`ok` と `error.code` を毎回確認します。`busy` は状態を読み、先行処理の完了後に再試行します。`invalid_input` はcatalogを取り直して訂正します。成功結果のparamsには正規化後の実値が入ります。UI編集とも共有されるので、toolの連続実行でもstateを取り直してください。

fieldsの結果を短くしたい場合は `keycap_get_catalog({ section: "fields", keys: ["keyWidth", "legendText"] })` のように項目を指定するか、`query: "legend"` でkey/labelを絞り込めます。

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
- preview生成を待ってmesh件数を取得し、exportの生成失敗が `ok: false` になる。JSON/3MF/STEP/STL/ZIPのdownload内容とfilenameを確認する。
- 長時間tool実行中は別の変更toolが `busy` となり、state取得は継続できる。キャンセル後に不要なdownloadが始まらない。
- preview生成中にUIから編集した場合は `preview_failed` を返し、変更前のmeshを変更後paramsの生成結果として成功扱いしない。

API mockを注入したheadless確認はアプリ側の接続とschemaを検証します。ネイティブブラウザAPIによる発見・実行を検証したこととは区別して結果を記録します。現行契約の詳細は [WebMCP操作契約](../architecture/webmcp.md) を参照してください。
