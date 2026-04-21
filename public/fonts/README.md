# Fonts

印字の書体選択では、フロントエンドへ同梱して配信できるライセンスのものだけを使います。

- `MPLUS1-Variable.ttf`
  - 表示名: `M PLUS 1 Variable`
  - OpenSCAD 名: `M PLUS 1`
  - 利用方針: variable font。named style は `Thin` から `Black` まで選択する
  - 出典: M+ FONTS 公式 `fonts/MPLUS1/variable/MPLUS1[wght].ttf`
  - ライセンス: `MPLUS1-OFL.txt`

- `MPLUS1p-Regular.ttf`
  - 表示名: `M PLUS 1p Regular`
  - OpenSCAD 名: `M PLUS 1p`
  - 出典: Google Fonts `ofl/mplus1p`
  - ライセンス: `MPLUS1p-OFL.txt`

- `MPLUSRounded1c-Regular.ttf`
  - 表示名: `M PLUS Rounded 1c Regular`
  - OpenSCAD 名: `M PLUS Rounded 1c`
  - 出典: Google Fonts `ofl/mplusrounded1c` / M+ FONTS for Google Fonts
  - ライセンス: `MPLUSRounded1c-OFL.txt`

- `DotGothic16-Regular.ttf`
  - 表示名: `DotGothic16 Regular`
  - OpenSCAD 名: `DotGothic16`
  - 出典: Google Fonts `ofl/dotgothic16`
  - ライセンス: `DotGothic16-OFL.txt`

static font はファイル名どおりの face をそのまま使い、擬似 italic / slanted / bold は付けません。明示的な輪郭補正は UI の数値入力からだけ行います。

`下線を付ける` は font file の `post` table にある `UnderlinePosition` と `UnderlineThickness` を使います。font metadata を使えない場合は任意値へフォールバックせず、下線を出しません。

いずれも legend の `text()` 生成に使います。最終的なライセンス確認は人間レビューで行ってください。
