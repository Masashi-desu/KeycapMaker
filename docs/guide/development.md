# 開発運用

## 基本コマンド

- 依存関係の導入: `npm install`
- 開発サーバー: `npm run dev`
- 本番ビルド確認: `npm run build`
- ビルド成果物の確認: `npm run preview`

## よく触る場所

### UI と保存形式

- `src/main.js`
  入力項目、export 導線、JSON 入出力、状態管理
- `src/data/keycap-editor-profiles.json`
  初期値、selector、profile 切り替え

### SCAD 形状

- `scad/base/keycap.scad`
  export 入口と whole-key orchestration
- `scad/modules/`
  shell、legend、stem、homing bar
- `scad/presets/`
  SCAD 側の既定値

### runtime / preview / export

- `src/lib/keycap-scad-bundle.js`
  JS と SCAD の橋渡し
- `src/lib/openscad-client.js`
  OpenSCAD worker 実行
- `src/lib/preview-scene.js`
  Three.js preview
- `src/lib/export-3mf.js`
  3MF 生成

### 配信アセット

- `public/vendor/openscad/`
  bundled OpenSCAD runtime
- `public/fonts/`
  legend 用フォント

## 変更時の確認

最低限、次を通す。

1. `npm run build`
2. ブラウザでアプリを開き、preview が表示されることを確認
3. 必要に応じて `簡易チェックを実行する` を押すか、`?autorun=1` で runtime smoke を走らせる

変更内容に応じて追加確認する。

- UI 変更:
  パラメータ編集、JSON 保存 / 読み込み、メッセージ表示
- SCAD 変更:
  representative な形状変更が preview に反映されること
- export 変更:
  3MF 保存、part 数、Bambu Studio 読み込み
- フォント変更:
  実文字表示と runtime asset 読み込み

## ドキュメント更新先

- 構成や責務が変わった:
  `docs/architecture/`
- 運用手順や確認手順が変わった:
  `docs/guide/`
- 採用済み判断:
  `docs/decisions/decision-log.md`
- 未着手 TODO:
  `docs/backlog/`
- UI デザイン正本:
  `docs/design/`

## 人間確認が必要な事項

- OpenSCAD runtime 同梱のライセンス影響
- フォント同梱のライセンス影響
- Bambu Studio での読み込み結果
- GitHub Pages 上での公開確認

## 補足

- `minimum-poc.scad` は現在も runtime smoke に使っているため削除しない
- 3MF は user-facing export だが、スライサー互換性の確認は別手順で扱う
