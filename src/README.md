# src directory

`src/` は、ViteがbundleするWeb app実装を置きます。UIだけでなく、state、i18n、project data、preview、export、OpenSCAD worker bridgeを含む公開sourceです。

主な責務は [アプリ全体像](../docs/architecture/overview.md) と [SCAD / export契約](../docs/architecture/scad-and-export.md)、変更手順と品質gateは [開発・貢献規約](../docs/guide/development.md) を正とします。

- `main.js`: app state、UI、import/exportのorchestration
- `data/`: shape registry、shape defaults、icon fallback data
- `i18n/`: locale dictionaryとlocale切替
- `lib/`: project data、preview、export、font/icon、OpenSCAD bridge等の独立責務

`src/README.md` は案内だけを担い、実装規約やrelease手順を重複記載しません。
