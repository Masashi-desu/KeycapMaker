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
- `手前から奥の傾斜`
- `左右の傾斜`
- `傾きの入力方法`
- `上面のすぼまり`
- `印字を入れる`
- `入れる文字`
- `書体`
- `書体 = M PLUS Rounded 1c`、文字 = `B / O / S` 前後で曲線が過度に角張らない
- `目印を付ける`
- `stemType`
- `左右の傾斜` を 28-32 度前後まで上げても、stem が上面へ露出しない
- flush legend の既定値で正面を向けても、文字面に body 色のチラつきが出ない

### 3. 編集データ JSON

- `編集データ JSON` を保存する
- 保存した JSON をドラッグ & ドロップで読み込む
- 読み込み後に preview と入力欄が元に戻ることを確認する

### 4. 3MF

- `3MF` を保存する
- ダウンロードファイル名が `keycap-preview.3mf` であることを確認する

## Bambu Studio 確認

geometry や export 契約を変えた場合は、保存した `keycap-preview.3mf` を Bambu Studio で開いて次を確認する。

- 単位が崩れていない
- body / homing / legend が想定どおりの位置関係を保っている
- `pitch / roll` を付けても homing bar や legend が空中に浮かない
- `pitch / roll` を強めに付けても stem が上面へ貫通しない
- legend が有効な場合、印字が埋没せず見えている
- flush legend の周囲で body と legend が同一面に重なっていない
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
