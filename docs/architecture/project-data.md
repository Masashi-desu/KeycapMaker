# プロジェクトデータ仕様

## 目的

プロジェクトは、編集中のキーキャップを複数まとめて保持する作業単位です。単体の編集データ JSON は現在表示しているキーキャップだけを復元する形式であり、プロジェクトはその JSON とプレビュー画像を束ねるディレクトリ形式として扱います。

## ディレクトリ構成

プロジェクトは次の構成を正とします。

```text
プロジェクト名/
├── keycaps/
│   ├── <keycap>.json
│   └── <keycap>.png または <keycap>.svg
└── KeycapMaker.json
```

- `KeycapMaker.json`
  プロジェクト manifest。プロジェクト名、キーキャップ一覧、現在選択中のキーキャップ ID、各キーキャップの JSON / preview path を保持します。
- `keycaps/*.json`
  既存の編集再開用 JSON と同じ canonical editor data です。
- `keycaps/*.(png|svg|webp|jpg)`
  プロジェクトセグメントの一覧に表示するプレビュー画像です。通常は現在の Three.js preview を縮小した PNG を保存し、preview が取得できない場合は SVG placeholder を保存します。

## Manifest

`KeycapMaker.json` の現在の schema は次の形です。

```json
{
  "kind": "keycap-maker/project",
  "schemaVersion": 1,
  "name": "My Project",
  "savedAt": "2026-04-30T00:00:00.000Z",
  "activeKeycapId": "keycap-...",
  "keycaps": [
    {
      "id": "keycap-...",
      "name": "Esc",
      "jsonPath": "keycaps/Esc.json",
      "previewPath": "keycaps/Esc.png",
      "displayOrder": 0,
      "previewViewState": {
        "direction": [0.62, 0.52, 0.58],
        "distanceScale": 2.3,
        "targetScale": [0, 0, 0],
        "viewOffsetRatio": [0, 0]
      }
    }
  ]
}
```

ルール:

- `kind` は `keycap-maker/project` 固定です。
- `schemaVersion` は `1` です。互換性のない変更を入れる場合だけ更新します。
- `jsonPath` と `previewPath` はプロジェクトディレクトリからの相対パスです。
- `displayOrder` はプロジェクトセグメントの表示順です。保存時は現在の一覧順に 0 始まりで振り直します。
- `previewViewState` は一覧用 preview を撮影したときのカメラ方向、距離、表示オフセットです。省略可能です。
- キーキャップ本体の編集値は manifest に複製せず、各 `keycaps/*.json` を正とします。
- `activeKeycapId` が存在する場合は読み込み直後の現在キーキャップとして使います。存在しない場合は一覧の先頭を使います。

## UI 動作

セグメントコントロールの一番左に `プロジェクト` を置きます。プロジェクトセグメントは次を持ちます。

- プロジェクト名
- キーキャップ一覧
  - preview 画像とキーキャップ名を表示する
  - 押下したキーキャップを現在の編集対象へ入れ替える
  - 表示順を持ち、順序ハンドルを掴むドラッグ & ドロップで並び替えられる。ドラッグ中は drop 前に一覧順を即時更新し、既存カードは移動アニメーションで詰める。各カードの順序番号は drag 開始時点の値を保持し、drop / cancel 後に最終順へ更新する
  - 個別の書き出しボタンから JSON / 3MF / STL の選択オーバーレイを開く
  - 編集中のキーキャップのコピーを追加する
- プロジェクトを保存

プロジェクト一覧から選択したキーキャップを編集した場合、その active keycap の JSON はプロジェクト内で追従します。単体 JSON をドラッグして読み込んだ場合は、読み込んだ内容をキーキャップ一覧へ新規追加し、そのキーキャップを active keycap にします。読み込み済みプロジェクトの既存一覧は保持します。

一覧用 preview は撮影時の `previewViewState` を保持します。active keycap のパラメータを変更して preview が再生成された場合、同じ `previewViewState` で一覧画像を再撮影し、キーキャップ一覧の画像を更新します。

従来の書き出しセグメントは持たず、ユーザー向けの JSON / 3MF / STL 書き出しはプロジェクト内キーキャップの個別オーバーレイから実行します。

## ドラッグ & ドロップ

ドロップされた item がディレクトリの場合:

1. `KeycapMaker.json` を探す
2. manifest を検証する
3. `keycaps/*.json` を既存の編集データ JSON と同じ parser で読み込む
4. `previewPath` の画像を一覧表示用に読み込む
5. active keycap または先頭の keycap を現在の編集対象にする

ドロップされた item が JSON ファイルの場合:

- 編集データ JSON として読み込み、現在の編集値へ反映します。
- 読み込んだ内容をキーキャップ一覧へ追加し、追加したキーキャップを現在の編集対象にします。
- すでにプロジェクトを読み込んでいる場合も、既存のプロジェクト一覧は保持します。
- 現在の形状へ bind できないパラメータが含まれている場合も、元 JSON の該当フィールドは project keycap の `editorDataPayload` に保持します。該当キーキャップを active にした時点で JSON 読み込みレポートを再計算して表示し、レポート内の `×` からその path を JSON から削除できます。

## 保存

プロジェクト保存は常に ZIP ダウンロードとして扱います。ZIP 内部には同じディレクトリ構成で `KeycapMaker.json` と `keycaps/` を格納します。

ディレクトリへの直接書き込みは行いません。GitHub Pages 上の静的配信アプリとして、保存時のブラウザ差分や File System Access API の権限差分を避けるためです。

保存済み ZIP はドラッグ & ドロップで直接読み込めます。読み込み時は archive 内から `KeycapMaker.json` を探し、同じ root 配下の `keycaps/` を展開してプロジェクトとして復元します。拡張子は `.zip` と、誤って `.zlp` になったファイル名も受け付けます。

## 実装位置

- `src/lib/project-data.js`
  project manifest、path、preview placeholder、project keycap entry の正規化。
- `src/main.js`
  プロジェクトセグメント UI、ディレクトリ / ZIP drag & drop、ZIP 保存。
- `test/project-data.test.js`
  manifest round-trip、path 正規化、preview data URL、非プロジェクト JSON の拒否を確認する。
