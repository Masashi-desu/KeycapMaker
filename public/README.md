# public directory

`public/` は、Viteが加工せずPages artifactへコピーする公開静的資源です。source codeから参照するruntime pathと、大容量binary、font、image、license/provenanceを保持します。

- `vendor/`: OpenSCAD、Coloris、icon providerのruntimeまたはnotice
- `fonts/`: legend font本体、OFL/terms、取得revisionとSHA-256を含むsource note
- `assets/j-stem-lp01/`: 公式STEPと派生preview OFF
- `icons/parameters/`: parameter UI用SVG
- `og-card.png`: `index.html` が指定するOpen Graph画像
- `favicon.svg`: page icon

全font inventoryは [fonts/README.md](fonts/README.md)、第三者資源全体の版・用途・ライセンスは [第三者コンポーネントとライセンス](../docs/third-party-licenses.md) を正とします。公開資源を変えた場合は、[開発・貢献規約](../CONTRIBUTING.md) のartifact gateを実行します。
