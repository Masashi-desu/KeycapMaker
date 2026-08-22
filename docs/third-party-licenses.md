# 第三者コンポーネントとライセンス

この文書は、公開ページで配信・実行する資源、ビルドとテストの直接・間接依存、platform 別 optional package、vendored code、CDN 資源を一覧化する正本です。プロジェクト自身のライセンスを定める文書ではありません。

バージョンは、固定資源では `package-lock.json` または同梱ファイルの出典メモ、動的CDNでは実装上の指定を基準にしています。共通ライセンス本文へのリンクは読みやすさのため公式本文へ、配布物固有のnoticeはリポジトリ内の同梱本文へ向けています。

## 公開ページで利用するライブラリとvendored code

| 正式名称 | バージョン / 取得方法 | 利用目的・利用箇所 | ライセンス本文 |
| --- | --- | --- | --- |
| [Three.js](https://www.npmjs.com/package/three/v/0.183.2) | `0.183.2` | `src/lib/preview-scene.js` の3D preview。Vite bundleへ含める | [MIT](https://opensource.org/license/mit) |
| [Paper.js](https://www.npmjs.com/package/paper/v/0.12.18) | `0.12.18` | Lucide stroke primitiveをfilled pathへ変換。Vite bundleへ含める | [MIT](https://opensource.org/license/mit) |
| [fflate](https://www.npmjs.com/package/fflate/v/0.8.2) | `0.8.2` | project ZIPと3MF packageの生成・展開。Vite bundleへ含める | [MIT](https://opensource.org/license/mit) |
| [Coloris](https://github.com/mdbassit/Coloris/tree/v0.25.0) | `0.25.0` | `public/vendor/coloris/` の色選択UI。JS/CSSをそのまま配信 | [MIT](../public/vendor/coloris/LICENSE) |
| [OpenSCAD WebAssembly runtime](https://github.com/openscad/openscad-wasm) | `OpenSCAD-2025.03.25.wasm24456-WebAssembly-web` | `public/vendor/openscad/` からブラウザ内形状生成を実行 | [GPL-2.0-only](../public/vendor/openscad/COPYING) |
| [Bootstrap Icons](https://icons.getbootstrap.com/) (`bootstrap-icons`) | jsDelivr `bootstrap-icons@1.11.3` | section開閉用chevron SVGを `src/main.js` が読み込む | [MIT](https://github.com/twbs/icons/blob/v1.11.3/LICENSE.md) |

## アイコンprovider

いずれもブラウザ実行時はjsDelivrの `latest` を試し、失敗時はlockfileに固定したpackage由来データを使います。生成したSVGはOpenSCADへ渡すlegend資源であり、providerのnoticeは公開物にも同梱します。

| 正式名称 | runtime / fallback | 利用箇所 | ライセンス本文 |
| --- | --- | --- | --- |
| [Lucide Icons](https://lucide.dev/) | `@lucide/icons@latest` / `1.21.0` | `src/lib/keycap-icons.js`、`public/vendor/lucide/` | [ISCおよびFeather由来MIT notice](../public/vendor/lucide/LICENSE) |
| [Material Symbols](https://fonts.google.com/icons) / [Iconify JSON package](https://www.npmjs.com/package/@iconify-json/material-symbols/v/1.2.79) | `@iconify-json/material-symbols@latest` / `1.2.79` | `src/lib/keycap-icons.js`、`public/vendor/material-symbols/` | [Apache License 2.0](../public/vendor/material-symbols/LICENSE) |
| [Font Awesome Free Solid](https://fontawesome.com/) | `@fortawesome/free-solid-svg-icons@latest` / `7.2.0` | `src/lib/keycap-icons.js`、`public/vendor/font-awesome/` | [Icons: CC BY 4.0、code: MIT](../public/vendor/font-awesome/LICENSE.txt) |
| [Remix Icon](https://remixicon.com/) | `remixicon@latest` / `4.9.1` | `src/lib/keycap-icons.js`、`public/vendor/remix-icon/` | [Remix Icon License v1.0](../public/vendor/remix-icon/LICENSE) |

`remixicon@4.9.1` のpackage metadataは `Apache-2.0` と宣言していますが、同じpackageに含まれる `License` は「Remix Icon License v1.0」です。このリポジトリは実際に配布された後者を保存し、より具体的な資産条件として扱います。

## Web UI用Google Fonts

`index.html` のGoogle Fonts stylesheetから、次のfamilyを実行時に取得します。stylesheet URLはバージョンを固定していないため、配信fontの版はGoogle Fonts側の現行版です。

| 正式名称 | 公式ページ | 利用箇所 | ライセンス本文 |
| --- | --- | --- | --- |
| `Noto Sans` | [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans) | Latin UI fallback | [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt) |
| `Noto Sans JP` | [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+JP) | 日本語UI | [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/notosansjp/OFL.txt) |
| `Noto Sans KR` | [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+KR) | 韓国語UI | [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/notosanskr/OFL.txt) |
| `Noto Sans SC` | [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+SC) | 簡体字中国語UI | [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/notosanssc/OFL.txt) |

## 同梱legend font

すべて `public/fonts/` から配信し、preview/exportのOpenSCAD `text()` とブラウザ内計測に使います。正確な取得revision、font metadata、SHA-256は各出典メモに記録しています。

| 正式名称 / 公式ページ | 同梱ファイル | 出典・版の証跡 | ライセンス本文 |
| --- | --- | --- | --- |
| [M PLUS 1](https://fonts.google.com/specimen/M%2BPLUS%2B1) | `MPLUS1-Variable.ttf` | [source note](../public/fonts/MPLUS1-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/MPLUS1-OFL.txt) |
| [M PLUS 1p](https://fonts.google.com/specimen/M%2BPLUS%2B1p) | `MPLUS1p-Regular.ttf` | [source note](../public/fonts/MPLUS1p-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/MPLUS1p-OFL.txt) |
| [Noto Sans](https://fonts.google.com/noto/specimen/Noto%2BSans) | `NotoSans-Variable.ttf` | [source note](../public/fonts/NotoSans-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/NotoSans-OFL.txt) |
| [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto%2BSans%2BJP) | `NotoSansJP-Variable.ttf` | [source note](../public/fonts/NotoSansJP-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/NotoSansJP-OFL.txt) |
| [M PLUS Rounded 1c](https://fonts.google.com/specimen/M%2BPLUS%2BRounded%2B1c) | `MPLUSRounded1c-Regular.ttf` | [source note](../public/fonts/MPLUSRounded1c-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/MPLUSRounded1c-OFL.txt) |
| [DotGothic16](https://fonts.google.com/specimen/DotGothic16) | `DotGothic16-Regular.ttf` | [source note](../public/fonts/DotGothic16-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/DotGothic16-OFL.txt) |
| [黒薔薇シンデレラ](https://modi.jpn.org/font_kurobara-cinderella.php) | `KurobaraCinderella-Regular.ttf` | [MODI/M+ provenance](../public/fonts/KurobaraCinderella-MODI.txt) | [MODI配布条件](../public/fonts/KurobaraCinderella-MODI.txt)および[M+ SIL OFL 1.1](../public/fonts/MPLUS1-OFL.txt) |
| [Bangers](https://fonts.google.com/specimen/Bangers) | `Bangers-Regular.ttf` | [source note](../public/fonts/Bangers-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/Bangers-OFL.txt) |
| [Creepster](https://fonts.google.com/specimen/Creepster) | `Creepster-Regular.ttf` | [source note](../public/fonts/Creepster-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/Creepster-OFL.txt) |
| [Rye](https://fonts.google.com/specimen/Rye) | `Rye-Regular.ttf` | [source note](../public/fonts/Rye-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/Rye-OFL.txt) |
| [Orbitron](https://fonts.google.com/specimen/Orbitron) | `Orbitron-Variable.ttf` | [source note](../public/fonts/Orbitron-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/Orbitron-OFL.txt) |
| [Grenze Gotisch](https://fonts.google.com/specimen/Grenze%2BGotisch) | `GrenzeGotisch-Variable.ttf` | [source note](../public/fonts/GrenzeGotisch-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/GrenzeGotisch-OFL.txt) |
| [MedievalSharp](https://fonts.google.com/specimen/MedievalSharp) | `MedievalSharp-Regular.ttf` | [source note](../public/fonts/MedievalSharp-SOURCE.txt) | [SIL OFL 1.1](../public/fonts/MedievalSharp-OFL.txt) |

黒薔薇シンデレラだけは、選択時に `src/lib/keycap-fonts.js` の実際のattribution文をUIへ表示し、コピー可能にしています。他の同梱fontは、確認済みOFL本文と出典メモを公開物に保持します。

## npm lockfile inventory

この区間は `package-lock.json` の全package entryを列挙します。`runtime direct` は公開bundleまたはfallback data、`runtime transitive` はその間接依存、`build` はVite toolchain、`platform optional` はlockfileが保持するOS/CPU別binaryです。

<!-- lockfile-inventory:start -->
| Package | Version | Scope / purpose | License text |
| --- | --- | --- | --- |
| [`@fortawesome/fontawesome-common-types`](https://www.npmjs.com/package/@fortawesome/fontawesome-common-types/v/7.2.0) | `7.2.0` | runtime transitive | [MIT](https://opensource.org/license/mit) |
| [`@fortawesome/free-solid-svg-icons`](https://www.npmjs.com/package/@fortawesome/free-solid-svg-icons/v/7.2.0) | `7.2.0` | runtime direct / icon fallback | [CC BY 4.0 and MIT](../public/vendor/font-awesome/LICENSE.txt) |
| [`@iconify-json/material-symbols`](https://www.npmjs.com/package/@iconify-json/material-symbols/v/1.2.79) | `1.2.79` | runtime direct / icon fallback | [Apache-2.0](../public/vendor/material-symbols/LICENSE) |
| [`@iconify/types`](https://www.npmjs.com/package/@iconify/types/v/2.0.0) | `2.0.0` | runtime transitive | [MIT](https://opensource.org/license/mit) |
| [`@lucide/icons`](https://www.npmjs.com/package/@lucide/icons/v/1.21.0) | `1.21.0` | runtime direct / icon fallback | [ISC and MIT notices](../public/vendor/lucide/LICENSE) |
| [`@types/estree`](https://www.npmjs.com/package/@types/estree/v/1.0.8) | `1.0.8` | build transitive / Rollup types | [MIT](https://opensource.org/license/mit) |
| [`esbuild`](https://www.npmjs.com/package/esbuild/v/0.27.7) | `0.27.7` | build transitive / Vite transform | [MIT](https://opensource.org/license/mit) |
| [`fdir`](https://www.npmjs.com/package/fdir/v/6.5.0) | `6.5.0` | build transitive / file traversal | [MIT](https://opensource.org/license/mit) |
| [`fflate`](https://www.npmjs.com/package/fflate/v/0.8.2) | `0.8.2` | runtime direct / ZIP and 3MF | [MIT](https://opensource.org/license/mit) |
| [`fsevents`](https://www.npmjs.com/package/fsevents/v/2.3.3) | `2.3.3` | build optional / macOS watcher | [MIT](https://opensource.org/license/mit) |
| [`nanoid`](https://www.npmjs.com/package/nanoid/v/3.3.11) | `3.3.11` | build transitive / PostCSS | [MIT](https://opensource.org/license/mit) |
| [`paper`](https://www.npmjs.com/package/paper/v/0.12.18) | `0.12.18` | runtime direct / SVG path conversion | [MIT](https://opensource.org/license/mit) |
| [`picocolors`](https://www.npmjs.com/package/picocolors/v/1.1.1) | `1.1.1` | build transitive | [ISC](https://spdx.org/licenses/ISC.html) |
| [`picomatch`](https://www.npmjs.com/package/picomatch/v/4.0.4) | `4.0.4` | build transitive / glob matching | [MIT](https://opensource.org/license/mit) |
| [`postcss`](https://www.npmjs.com/package/postcss/v/8.5.10) | `8.5.10` | build transitive / CSS processing | [MIT](https://opensource.org/license/mit) |
| [`remixicon`](https://www.npmjs.com/package/remixicon/v/4.9.1) | `4.9.1` | runtime direct / icon fallback | [package metadata: Apache-2.0; distributed notice: Remix Icon License v1.0](../public/vendor/remix-icon/LICENSE) |
| [`rollup`](https://www.npmjs.com/package/rollup/v/4.60.1) | `4.60.1` | build transitive / bundling | [MIT](https://opensource.org/license/mit) |
| [`source-map-js`](https://www.npmjs.com/package/source-map-js/v/1.2.1) | `1.2.1` | build transitive / source maps | [BSD-3-Clause](https://opensource.org/license/bsd-3-clause) |
| [`three`](https://www.npmjs.com/package/three/v/0.183.2) | `0.183.2` | runtime direct / preview | [MIT](https://opensource.org/license/mit) |
| [`tinyglobby`](https://www.npmjs.com/package/tinyglobby/v/0.2.16) | `0.2.16` | build transitive / Vite file matching | [MIT](https://opensource.org/license/mit) |
| [`vite`](https://www.npmjs.com/package/vite/v/7.3.5) | `7.3.5` | build direct | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/aix-ppc64`](https://www.npmjs.com/package/@esbuild/aix-ppc64/v/0.27.7) | `0.27.7` | platform optional / AIX ppc64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/android-arm`](https://www.npmjs.com/package/@esbuild/android-arm/v/0.27.7) | `0.27.7` | platform optional / Android arm | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/android-arm64`](https://www.npmjs.com/package/@esbuild/android-arm64/v/0.27.7) | `0.27.7` | platform optional / Android arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/android-x64`](https://www.npmjs.com/package/@esbuild/android-x64/v/0.27.7) | `0.27.7` | platform optional / Android x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/darwin-arm64`](https://www.npmjs.com/package/@esbuild/darwin-arm64/v/0.27.7) | `0.27.7` | platform optional / macOS arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/darwin-x64`](https://www.npmjs.com/package/@esbuild/darwin-x64/v/0.27.7) | `0.27.7` | platform optional / macOS x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/freebsd-arm64`](https://www.npmjs.com/package/@esbuild/freebsd-arm64/v/0.27.7) | `0.27.7` | platform optional / FreeBSD arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/freebsd-x64`](https://www.npmjs.com/package/@esbuild/freebsd-x64/v/0.27.7) | `0.27.7` | platform optional / FreeBSD x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-arm`](https://www.npmjs.com/package/@esbuild/linux-arm/v/0.27.7) | `0.27.7` | platform optional / Linux arm | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-arm64`](https://www.npmjs.com/package/@esbuild/linux-arm64/v/0.27.7) | `0.27.7` | platform optional / Linux arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-ia32`](https://www.npmjs.com/package/@esbuild/linux-ia32/v/0.27.7) | `0.27.7` | platform optional / Linux ia32 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-loong64`](https://www.npmjs.com/package/@esbuild/linux-loong64/v/0.27.7) | `0.27.7` | platform optional / Linux loong64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-mips64el`](https://www.npmjs.com/package/@esbuild/linux-mips64el/v/0.27.7) | `0.27.7` | platform optional / Linux mips64el | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-ppc64`](https://www.npmjs.com/package/@esbuild/linux-ppc64/v/0.27.7) | `0.27.7` | platform optional / Linux ppc64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-riscv64`](https://www.npmjs.com/package/@esbuild/linux-riscv64/v/0.27.7) | `0.27.7` | platform optional / Linux riscv64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-s390x`](https://www.npmjs.com/package/@esbuild/linux-s390x/v/0.27.7) | `0.27.7` | platform optional / Linux s390x | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/linux-x64`](https://www.npmjs.com/package/@esbuild/linux-x64/v/0.27.7) | `0.27.7` | platform optional / Linux x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/netbsd-arm64`](https://www.npmjs.com/package/@esbuild/netbsd-arm64/v/0.27.7) | `0.27.7` | platform optional / NetBSD arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/netbsd-x64`](https://www.npmjs.com/package/@esbuild/netbsd-x64/v/0.27.7) | `0.27.7` | platform optional / NetBSD x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/openbsd-arm64`](https://www.npmjs.com/package/@esbuild/openbsd-arm64/v/0.27.7) | `0.27.7` | platform optional / OpenBSD arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/openbsd-x64`](https://www.npmjs.com/package/@esbuild/openbsd-x64/v/0.27.7) | `0.27.7` | platform optional / OpenBSD x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/openharmony-arm64`](https://www.npmjs.com/package/@esbuild/openharmony-arm64/v/0.27.7) | `0.27.7` | platform optional / OpenHarmony arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/sunos-x64`](https://www.npmjs.com/package/@esbuild/sunos-x64/v/0.27.7) | `0.27.7` | platform optional / SunOS x64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/win32-arm64`](https://www.npmjs.com/package/@esbuild/win32-arm64/v/0.27.7) | `0.27.7` | platform optional / Windows arm64 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/win32-ia32`](https://www.npmjs.com/package/@esbuild/win32-ia32/v/0.27.7) | `0.27.7` | platform optional / Windows ia32 | [MIT](https://opensource.org/license/mit) |
| [`@esbuild/win32-x64`](https://www.npmjs.com/package/@esbuild/win32-x64/v/0.27.7) | `0.27.7` | platform optional / Windows x64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-android-arm-eabi`](https://www.npmjs.com/package/@rollup/rollup-android-arm-eabi/v/4.60.1) | `4.60.1` | platform optional / Android arm | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-android-arm64`](https://www.npmjs.com/package/@rollup/rollup-android-arm64/v/4.60.1) | `4.60.1` | platform optional / Android arm64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-darwin-arm64`](https://www.npmjs.com/package/@rollup/rollup-darwin-arm64/v/4.60.1) | `4.60.1` | platform optional / macOS arm64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-darwin-x64`](https://www.npmjs.com/package/@rollup/rollup-darwin-x64/v/4.60.1) | `4.60.1` | platform optional / macOS x64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-freebsd-arm64`](https://www.npmjs.com/package/@rollup/rollup-freebsd-arm64/v/4.60.1) | `4.60.1` | platform optional / FreeBSD arm64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-freebsd-x64`](https://www.npmjs.com/package/@rollup/rollup-freebsd-x64/v/4.60.1) | `4.60.1` | platform optional / FreeBSD x64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-arm-gnueabihf`](https://www.npmjs.com/package/@rollup/rollup-linux-arm-gnueabihf/v/4.60.1) | `4.60.1` | platform optional / Linux arm GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-arm-musleabihf`](https://www.npmjs.com/package/@rollup/rollup-linux-arm-musleabihf/v/4.60.1) | `4.60.1` | platform optional / Linux arm musl | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-arm64-gnu`](https://www.npmjs.com/package/@rollup/rollup-linux-arm64-gnu/v/4.60.1) | `4.60.1` | platform optional / Linux arm64 GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-arm64-musl`](https://www.npmjs.com/package/@rollup/rollup-linux-arm64-musl/v/4.60.1) | `4.60.1` | platform optional / Linux arm64 musl | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-loong64-gnu`](https://www.npmjs.com/package/@rollup/rollup-linux-loong64-gnu/v/4.60.1) | `4.60.1` | platform optional / Linux loong64 GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-loong64-musl`](https://www.npmjs.com/package/@rollup/rollup-linux-loong64-musl/v/4.60.1) | `4.60.1` | platform optional / Linux loong64 musl | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-ppc64-gnu`](https://www.npmjs.com/package/@rollup/rollup-linux-ppc64-gnu/v/4.60.1) | `4.60.1` | platform optional / Linux ppc64 GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-ppc64-musl`](https://www.npmjs.com/package/@rollup/rollup-linux-ppc64-musl/v/4.60.1) | `4.60.1` | platform optional / Linux ppc64 musl | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-riscv64-gnu`](https://www.npmjs.com/package/@rollup/rollup-linux-riscv64-gnu/v/4.60.1) | `4.60.1` | platform optional / Linux riscv64 GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-riscv64-musl`](https://www.npmjs.com/package/@rollup/rollup-linux-riscv64-musl/v/4.60.1) | `4.60.1` | platform optional / Linux riscv64 musl | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-s390x-gnu`](https://www.npmjs.com/package/@rollup/rollup-linux-s390x-gnu/v/4.60.1) | `4.60.1` | platform optional / Linux s390x GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-x64-gnu`](https://www.npmjs.com/package/@rollup/rollup-linux-x64-gnu/v/4.60.1) | `4.60.1` | platform optional / Linux x64 GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-linux-x64-musl`](https://www.npmjs.com/package/@rollup/rollup-linux-x64-musl/v/4.60.1) | `4.60.1` | platform optional / Linux x64 musl | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-openbsd-x64`](https://www.npmjs.com/package/@rollup/rollup-openbsd-x64/v/4.60.1) | `4.60.1` | platform optional / OpenBSD x64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-openharmony-arm64`](https://www.npmjs.com/package/@rollup/rollup-openharmony-arm64/v/4.60.1) | `4.60.1` | platform optional / OpenHarmony arm64 | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-win32-arm64-msvc`](https://www.npmjs.com/package/@rollup/rollup-win32-arm64-msvc/v/4.60.1) | `4.60.1` | platform optional / Windows arm64 MSVC | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-win32-ia32-msvc`](https://www.npmjs.com/package/@rollup/rollup-win32-ia32-msvc/v/4.60.1) | `4.60.1` | platform optional / Windows ia32 MSVC | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-win32-x64-gnu`](https://www.npmjs.com/package/@rollup/rollup-win32-x64-gnu/v/4.60.1) | `4.60.1` | platform optional / Windows x64 GNU | [MIT](https://opensource.org/license/mit) |
| [`@rollup/rollup-win32-x64-msvc`](https://www.npmjs.com/package/@rollup/rollup-win32-x64-msvc/v/4.60.1) | `4.60.1` | platform optional / Windows x64 MSVC | [MIT](https://opensource.org/license/mit) |
<!-- lockfile-inventory:end -->

## CIで直接利用するtoolとAction

| 正式名称 | 固定版 | 利用目的 | ライセンス本文 |
| --- | --- | --- | --- |
| [actionlint](https://github.com/rhysd/actionlint) | `1.7.12` | GitHub Actions構文lint | [MIT](https://github.com/rhysd/actionlint/blob/v1.7.12/LICENSE.txt) |
| [actions/checkout](https://github.com/actions/checkout) | `v7.0.1` / commit `3d3c42e…` | repository checkout | [MIT](https://github.com/actions/checkout/blob/v7.0.1/LICENSE) |
| [actions/setup-node](https://github.com/actions/setup-node) | `v7.0.0` / commit `8207627…` | Node.js 24 setupとnpm cache | [MIT](https://github.com/actions/setup-node/blob/v7.0.0/LICENSE) |
| [actions/configure-pages](https://github.com/actions/configure-pages) | `v6.0.0` / commit `45bfe01…` | Pages build設定 | [MIT](https://github.com/actions/configure-pages/blob/v6.0.0/LICENSE) |
| [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) | `v5.0.0` / commit `fc324d3…` | Pages artifact upload | [MIT](https://github.com/actions/upload-pages-artifact/blob/v5.0.0/LICENSE) |
| [actions/deploy-pages](https://github.com/actions/deploy-pages) | `v5.0.0` / commit `cd2ce8f…` | GitHub Pages deploy | [MIT](https://github.com/actions/deploy-pages/blob/v5.0.0/LICENSE) |

これらのJavaScript Actionは、各公式releaseのNode.js 24版をcommit SHAで固定しています。`actionlint` は公式containerのversion tagを固定しています。

## J-STEM-LP01参照CADの未解決条件

[JezailFunder JapanのJ-STEM-LP01](https://jezailfunder.jp/products/j-stem-lp01) が公式配布する `j-stem.step` と、その派生preview meshを `public/assets/j-stem-lp01/` で配信しています。公式ダウンロードと同梱STEPのSHA-256は一致します。

| 正式名称 | 同梱物 | 公式配布元 | ライセンス / 条件 |
| --- | --- | --- | --- |
| J-STEM-LP01 reference CAD | `j-stem-lp01.step`、`j-stem-lp01-reference.off` | [product page](https://jezailfunder.jp/products/j-stem-lp01)、[official STEP](https://cdn.shopify.com/s/files/1/0937/1798/7635/files/j-stem.step) | 個別ライセンス名と再配布許諾は公式ページに提示されていません。[公式利用規約](https://jezailfunder.jp/policies/terms-of-service)を参照 |

この項目だけは、一次情報から再配布ライセンスを確定できません。既存機能を無断で削除・置換しないため現状と証跡を明示して残していますが、次の公開更新前に権利者からSTEPと派生OFFの再配布許諾を確認する必要があります。

## 更新規則

- `package.json` または `package-lock.json` の依存を変えたら、この文書のlockfile inventory、版、用途、ライセンス本文を同じchangeで更新する。
- `index.html` のGoogle Fonts family、jsDelivr package、`public/vendor/`、`public/fonts/`、外部CADを追加・更新・削除したら、該当する一覧と同梱notice/provenanceを同期する。
- `npm run test:docs` でlockfile全entry、利用中のGoogle Fonts、jsDelivr package、bundled font、vendored directory、Open Graph画像、Markdown参照、文書化したnpm scriptを静的検証する。
- ライセンスが不明な資源は推測で名前を付けず、一次情報と未解決状態を明記して公開可否を人間が判断する。
