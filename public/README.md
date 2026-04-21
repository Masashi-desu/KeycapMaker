# public ディレクトリ案内

`public/` は GitHub Pages でそのまま配信する静的アセットの置き場です。

## 配置候補

- Wasm バイナリ
- フォントファイル
- アイコンや画像
- 配信時にビルドでそのまま参照する補助ファイル

`text()` を利用するフォントを同梱する場合も、このディレクトリ配下の配置方針を先に決めてください。

## 現在の同梱物

- `vendor/openscad/`: OpenSCAD WASM runtime
- `fonts/MPLUS1-Variable.ttf`: `M PLUS 1` variable font
- `fonts/MPLUS1p-Regular.ttf`: 標準ゴシック
- `fonts/MPLUSRounded1c-Regular.ttf`: 丸みのあるゴシック
- `fonts/DotGothic16-Regular.ttf`: ドット風ゴシック
- `fonts/*-OFL.txt`: 各フォントのライセンス
