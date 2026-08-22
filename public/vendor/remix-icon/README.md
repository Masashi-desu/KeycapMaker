# Remix Icon

- Package: `remixicon`
- Runtime source: jsDelivr `remixicon@latest`
- Fallback package version: `4.9.1`
- Source: https://remixicon.com/
- Repository: https://github.com/Remix-Design/remixicon
- Use: browser-side icon search and SVG legend generation
- Runtime subset: `fonts/remixicon.symbol.svg` 由来のSVG path data
- Distributed asset terms: [Remix Icon License v1.0](LICENSE)

BrowserがonlineならjsDelivrのlatest symbol SVGを読み、失敗時はinstalled packageから生成したfallback path dataを使います。取得したSVG bodyはOpenSCADへ渡す前にsanitizeします。

`remixicon@4.9.1` のpackage metadataは `Apache-2.0` と宣言していますが、同じpackageの `License` fileは2026年1月版のRemix Icon License v1.0です。このdirectoryは実際に配布されたlicense本文を保存します。同条件はlarger workでの機能的・装飾的利用を許可し、standalone icon pack販売、競合icon library、logo/trademark用途を制限します。
