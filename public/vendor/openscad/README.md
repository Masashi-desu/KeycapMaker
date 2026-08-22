# OpenSCAD WebAssembly runtime

- Bundled files: `openscad.js`, `openscad.wasm`
- Upstream archive: https://files.openscad.org/playground/OpenSCAD-2025.03.25.wasm24456-WebAssembly-web.zip
- Version label: `OpenSCAD-2025.03.25.wasm24456-WebAssembly-web`
- Projects: [OpenSCAD](https://github.com/openscad/openscad), [OpenSCAD Playground](https://github.com/openscad/openscad-playground), [OpenSCAD WASM port](https://github.com/openscad/openscad-wasm)
- Use: GitHub Pages上で外部runtimeへ依存せず、browser内preview/export geometryを生成する
- License: [GNU GPL version 2](COPYING) (`GPL-2.0-only` as declared by the official WASM port repository)

2026-08-22の再確認で、bundled JS/WASMは上記official archiveとbyte一致しました。

- Archive SHA-256: `0968af31b9c9b3bba68d9031de1695ccae51c32231a1aab4ef27b18c86379f3b`
- `openscad.js`: `904a47f29e63afb597bedef747da3b457d8ea17cc793c462c6c8b444e918a62e`
- `openscad.wasm`: `f72ce246c02c0e501990837102be383326b153fd761774ebfacce5c80c5ecf26`
- `COPYING`: `8177f97513213526df2cf6184d8ff986c675afb514d4e68a404010521b880643`

`COPYING` はGNU GPL version 2の同梱本文です。runtimeを更新するときはarchive version、upstream license、compiled dependency notice、browser testを同じchangeで確認します。
