# Open Graph画像

公開画像は [og-image.png](../../public/og-image.png) の1点です。Open Graph、Twitter card、root READMEは同じPNGを参照します。編集用の正本は [generate-open-graph.mjs](../../scripts/generate-open-graph.mjs) で、画像生成サービスや別の編集用SVGは使いません。

## 再生成

Node.js 24系で依存を導入し、初回はPlaywrightのChromiumも導入します。

```sh
npm ci
npx playwright install chromium
npm run generate:og
```

生成のたびに固定版のManropeをCDNから取得します。取得したfont binaryはメモリ上で使い、リポジトリや公開物には保存しません。通信失敗、SHA-256不一致、font読み込み失敗、内容のはみ出しがあれば処理を失敗させ、既存PNGを保持します。代替フォントによる生成は行いません。Chromiumは通常のブラウザセッションとは別のheadless contextで起動し、処理後に終了します。

一時的な比較画像は次のように無視対象のdirectoryへ生成できます。

```sh
npm run generate:og -- --output .tmp/open-graph/preview.png
```

通常の `npm run build` は保存済みPNGをコピーします。CDNへの接続は画像の再生成時だけ必要です。

## デザインと編集箇所

- サイズ: 1200×630 px
- 配置: 全体を水平・垂直方向に中央寄せし、左に [favicon.svg](../../public/favicon.svg)、右に3段のテキストを置く
- タイトル: `KeycapMaker`
- コピー: `Let's make custom keycaps.`
- 形式ピル: `.3mf`、`.stl`、`.step`、`project file`
- フォント: Manrope、weight 800 / 500 / 600。固定版・ハッシュ・ライセンスは [第三者資源一覧](../third-party-licenses.md#open-graph画像の生成用フォント) を参照する
- 背景・文字・ピルの色: [theme.css](../../src/theme.css) のlight theme tokenから読み込む

文言、余白、文字サイズは生成スクリプトを変更します。アイコンの形・配色を変える場合はfaviconを更新してから再生成します。古い画像、別案、font binaryを追跡対象に追加しません。

変更後はPNGを開き、文字欠け、ピルの収まり、中央配置を確認します。画像URLや文言を変える場合は `index.html` のOpen Graph / Twitter metadataとroot READMEも同期します。品質gateは [開発・貢献規約](../../CONTRIBUTING.md) のartifact classを適用します。
