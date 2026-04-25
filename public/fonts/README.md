# Fonts

印字の書体選択では、フロントエンドへ同梱して配信できるライセンスのものだけを使います。

## 軽量取り込みルール

- 同梱する font は、再配布と Web 配信が明確に許可されたものだけにする。
- font file と同じ directory に、適用ライセンス本文または配布元の利用条件メモを残す。
- `*-SOURCE.txt` または同等の provenance note に、配布元 URL、取得日または review date、bundled filenames、font metadata、SHA-256 を残す。
- できるだけ commit / tag 固定の URL で取得する。既存資産で当初の取得日が未記録のものは、review date と Git 上の初回追加日を記録する。
- サブセット化、形式変換、glyph 改変は原則しない。必要な場合は別 font として扱い、Reserved Font Name とライセンス条件を再確認する。
- UI 上の attribution が必要な font は、抽象的な注意ではなく実際の表記文を font 定義へ入れる。

- `MPLUS1-Variable.ttf`
  - 表示名: `M PLUS 1 Variable`
  - OpenSCAD 名: `M PLUS 1`
  - 利用方針: variable font。named style は `Thin` から `Black` まで選択する
  - 出典: M+ FONTS 公式 `fonts/MPLUS1/variable/MPLUS1[wght].ttf`
  - ライセンス: `MPLUS1-OFL.txt`
  - 出典メモ: `MPLUS1-SOURCE.txt`

- `MPLUS1p-Regular.ttf`
  - 表示名: `M PLUS 1p Regular`
  - OpenSCAD 名: `M PLUS 1p`
  - 出典: Google Fonts `ofl/mplus1p`
  - ライセンス: `MPLUS1p-OFL.txt`
  - 出典メモ: `MPLUS1p-SOURCE.txt`

- `NotoSans-Variable.ttf`
  - 表示名: `Noto Sans Variable`
  - OpenSCAD 名: `Noto Sans`
  - 利用方針: variable font。named style は `Thin` から `Black` まで選択する
  - 出典: Google Fonts `ofl/notosans`
  - ライセンス: `NotoSans-OFL.txt`
  - 出典メモ: `NotoSans-SOURCE.txt`

- `NotoSansJP-Variable.ttf`
  - 表示名: `Noto Sans JP Variable`
  - OpenSCAD 名: `Noto Sans JP`
  - 利用方針: variable font。named style は `Thin` から `Black` まで選択する
  - 出典: Google Fonts `ofl/notosansjp`
  - ライセンス: `NotoSansJP-OFL.txt`
  - 出典メモ: `NotoSansJP-SOURCE.txt`

- `MPLUSRounded1c-Regular.ttf`
  - 表示名: `M PLUS Rounded 1c Regular`
  - OpenSCAD 名: `M PLUS Rounded 1c`
  - 出典: Google Fonts `ofl/mplusrounded1c` / M+ FONTS for Google Fonts
  - ライセンス: `MPLUSRounded1c-OFL.txt`
  - 出典メモ: `MPLUSRounded1c-SOURCE.txt`

- `DotGothic16-Regular.ttf`
  - 表示名: `DotGothic16 Regular`
  - OpenSCAD 名: `DotGothic16`
  - 出典: Google Fonts `ofl/dotgothic16`
  - ライセンス: `DotGothic16-OFL.txt`
  - 出典メモ: `DotGothic16-SOURCE.txt`

- `KurobaraCinderella-Regular.ttf`
  - 表示名: `黒薔薇シンデレラ`
  - OpenSCAD 名: `kurobara-cinderella`
  - 利用方針: static font。棘付きの和文 gothic display として日本語 legend に使う
  - 出典: MODI工場 `font_kurobara-cinderella.php`
  - ライセンス: `KurobaraCinderella-MODI.txt` と `MPLUS1-OFL.txt`

- `Bangers-Regular.ttf`
  - 表示名: `Bangers Regular`
  - OpenSCAD 名: `Bangers`
  - 利用方針: static font。コミック表紙寄りの display 用として短い legend に使う
  - 出典: Google Fonts `ofl/bangers`
  - ライセンス: `Bangers-OFL.txt`
  - 出典メモ: `Bangers-SOURCE.txt`

- `Creepster-Regular.ttf`
  - 表示名: `Creepster Regular`
  - OpenSCAD 名: `Creepster`
  - 利用方針: static font。ホラー映画タイトル寄りの display 用として短い legend に使う
  - 出典: Google Fonts `ofl/creepster`
  - ライセンス: `Creepster-OFL.txt`
  - 出典メモ: `Creepster-SOURCE.txt`

- `Rye-Regular.ttf`
  - 表示名: `Rye Regular`
  - OpenSCAD 名: `Rye`
  - 利用方針: static font。西部劇ポスター寄りの display 用として短い legend に使う
  - 出典: Google Fonts `ofl/rye`
  - ライセンス: `Rye-OFL.txt`
  - 出典メモ: `Rye-SOURCE.txt`

- `Orbitron-Variable.ttf`
  - 表示名: `Orbitron Regular`
  - OpenSCAD 名: `Orbitron`
  - 利用方針: variable font の配布物を同梱するが、現 UI では family 既定の Regular face として扱う
  - 出典: Google Fonts `ofl/orbitron`
  - ライセンス: `Orbitron-OFL.txt`
  - 出典メモ: `Orbitron-SOURCE.txt`

- `GrenzeGotisch-Variable.ttf`
  - 表示名: `Grenze Gotisch Regular`
  - OpenSCAD 名: `Grenze Gotisch`
  - 利用方針: variable font の配布物を同梱するが、現 UI では family 既定の Regular face として扱う
  - 系統: `Art Gothic` 検索で見つけやすい近似候補。Blackletter 寄りの display
  - 出典: Google Fonts `ofl/grenzegotisch`
  - ライセンス: `GrenzeGotisch-OFL.txt`
  - 出典メモ: `GrenzeGotisch-SOURCE.txt`

- `MedievalSharp-Regular.ttf`
  - 表示名: `MedievalSharp Regular`
  - OpenSCAD 名: `MedievalSharp`
  - 利用方針: static font。石碑 inscription 寄りの gothic display として短い legend に使う
  - 系統: `Art Gothic` 検索で見つけやすい近似候補
  - 出典: Google Fonts `ofl/medievalsharp`
  - ライセンス: `MedievalSharp-OFL.txt`
  - 出典メモ: `MedievalSharp-SOURCE.txt`

static font はファイル名どおりの face をそのまま使い、擬似 italic / slanted / bold は付けません。明示的な輪郭補正は UI の数値入力からだけ行います。

`下線を付ける` は font file の `post` table にある `UnderlinePosition` と `UnderlineThickness` を使います。font metadata を使えない場合は任意値へフォールバックせず、下線を出しません。

いずれも legend の `text()` 生成に使います。display 系の追加書体は主に短い legend 向けです。`黒薔薇シンデレラ` は日本語を含む和文 display として扱い、MODI 配布元の利用条件と M+ FONTS 派生の注記を `KurobaraCinderella-MODI.txt` に残します。`Art Gothic` そのものはこのリポジトリには同梱せず、再配布条件が明確な OFL 配布物の近似候補を入れています。
