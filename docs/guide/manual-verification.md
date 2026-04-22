# 手動確認手順

## 目的

geometry contract、runtime、export を変更したときに、ブラウザ上とスライサー上で最低限確認すべき項目をまとめる。

## ブラウザ確認

### 1. 初期表示

- アプリがエラーなしで開く
- 初回 preview が表示される
- カラーピッカーやセクション切り替えが壊れていない

### 2. 編集操作

代表値として次を変え、preview が破綻しないことを確認する。

- `横幅`
- `上面中央の高さ`
- `キーリムを付ける`
- `キーリムの幅`
- `上方向の高さ`
- `下方向の高さ`
- `手前から奥の傾斜`
- `左右の傾斜`
- `傾きの入力方法`
- `上面のすぼまり`
- `印字を入れる`
- `入れる文字`
- 文字を `A` から `Shift` や `ShiftLock` へ増やしても、`文字の大きさ` を触らない限り印字サイズが自動で変わらない
- `文字の大きさ` を変えたときだけ印字サイズが変わる
- `書体`
- `書体` の虫眼鏡ボタンで検索 textbox と scrollable な選択欄が開く
- 選択欄の各 font 名がその font で表示される
- `M PLUS` などを入力すると候補がリアルタイムで絞り込まれる
- 候補から `M PLUS 1 Variable` を選べる
- `Bangers` / `Creepster` / `Rye` / `Orbitron` で検索して候補が出る
- `Art Gothic` で検索したとき `Grenze Gotisch Regular` と `MedievalSharp Regular` が候補に出る
- `黒薔薇` で検索したとき `黒薔薇シンデレラ` が候補に出る
- `黒薔薇シンデレラ` を選択中だけ、実際に使う著作権・ライセンス表記文が表示される
- `黒薔薇シンデレラ` の `コピー` ボタンで表記文をクリップボードへ出せる
- `M PLUS 1 Variable` 選択時に `フォント内スタイル` が有効になり、`Bold` などの named style へ切り替えられる
- static font を選んだとき `フォント内スタイル` が非活性になる
- `Orbitron Regular` を選んでも `フォント内スタイル` は有効化されず、Regular face のまま扱われる
- `下線を付ける` をオンにしたとき、font ごとの下線位置と太さが変わり、特に `M PLUS 1 Variable / Thin / A` で線が文字中央へ食い込まない
- `太さ補正 = 0` のとき、font を替えても意図しない太らせが入らない
- `太さ補正` をプラス / マイナスへ振ったときだけ輪郭が変わる
- `Bangers / A`、`Creepster / A`、`Rye / A`、`Orbitron / A` を切り替えても preview が崩れない
- `Grenze Gotisch / A`、`MedievalSharp / A` を切り替えても preview が崩れない
- `黒薔薇シンデレラ / 鍵 / あ / 黒` 前後で preview が崩れない
- `書体 = M PLUS Rounded 1c Regular`、文字 = `B / O / S` 前後で曲線が過度に角張らない
- `目印を付ける`
- `stemType`
- typewriter shape で rim を有効にしたとき、body と rim が別色で破綻なく分かれて見える
- `上方向の高さ = 0`、`下方向の高さ = 0` のとき、rim がキートップと面一で欠けや浮きが出ない
- `上方向の高さ` または `下方向の高さ` を増やしたときだけ、対応方向へ rim が伸びる
- `左右の傾斜` を 28-32 度前後まで上げても、stem が上面へ露出しない
- flush legend の既定値で正面を向けても、文字面に body 色のチラつきが出ない

### 3. 編集データ JSON

- 設定タブ先頭の `名称` を分かりやすい文字列へ変更する
- `編集データ JSON` を保存する
- ダウンロードファイル名が `名称 + .json` になることを確認する
- 保存した JSON をドラッグ & ドロップで読み込む
- 読み込み後に preview と入力欄が元に戻ることを確認する

### 4. 3MF

- `3MF` を保存する
- ダウンロードファイル名が `名称 + .3mf` になることを確認する

## Bambu Studio 確認

geometry や export 契約を変えた場合は、保存した `名称 + .3mf` を Bambu Studio で開いて次を確認する。

- 単位が崩れていない
- body / rim / homing / legend が想定どおりの位置関係を保っている
- `pitch / roll` を付けても homing bar や legend が空中に浮かない
- `pitch / roll` を強めに付けても stem が上面へ貫通しない
- legend が有効な場合、印字が埋没せず見えている
- flush legend の周囲で body と legend が同一面に重なっていない
- typewriter key rim が有効な場合、rim が body と別 part のまま崩れていない
- homing bar が有効な場合、別 part として崩れていない
- 複数 part がある場合、オブジェクト分離が維持されている

色は補助情報として扱う。色が見えるかどうかより、part 分離と位置関係を優先して確認する。

## 実行タイミング

- `scad/base/` または `scad/modules/` を変更したとき
- `src/lib/keycap-scad-bundle.js` を変更したとき
- `src/lib/export-3mf.js` を変更したとき
- runtime やフォント資産を入れ替えたとき

## 記録先

- 採用済み判断や重要な確認結果:
  `docs/decisions/decision-log.md`
- 未解決の問題や次の拡張タスク:
  `docs/backlog/`
