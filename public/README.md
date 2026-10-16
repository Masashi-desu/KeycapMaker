# public directory

`public/` は、Viteが加工せずPages artifactへコピーする公開静的資源です。source codeから参照するruntime pathと、大容量binary、font、image、license/provenanceを保持します。

- `vendor/`: OpenSCAD、Coloris、icon providerのruntimeまたはnotice
- `fonts/`: legend font本体、OFL/terms、取得revisionとSHA-256を含むsource note
- `assets/j-stem-lp01/`: 公式STEPと派生preview OFF
- `icons/parameters/`: parameter UI用SVG
- `og-image.png`: `index.html` のOpen Graph / Twitter画像。`scripts/generate-open-graph.mjs` から生成する
- `favicon.svg`: パレットを天面に収めた一体型キーキャップのpage icon

`favicon.svg` は、このプロジェクト向けにimagegenで生成・採用した図案をVTracerで輪郭抽出し、6つの色面へ整理したSVGです。背景は透明、天面はオフホワイトで、側面とパレットの板は共通のアクセントカラー `#b8884c` を使います。外部のicon providerから取得した図案ではありません。

Open Graph画像は、採用済みの `favicon.svg`、light themeの配色、生成時にCDNから取得するManropeから作ります。生成スクリプトを編集用の正本とし、公開資源はPNG 1点だけにします。再生成方法は [Open Graph画像](../docs/guide/open-graph.md) を参照してください。

全font inventoryは [fonts/README.md](fonts/README.md)、第三者資源全体の版・用途・ライセンスは [第三者コンポーネントとライセンス](../docs/third-party-licenses.md) を正とします。公開資源を変えた場合は、[開発・貢献規約](../CONTRIBUTING.md) のartifact gateを実行します。
