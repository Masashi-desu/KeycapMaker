# 判断記録

採用済みの設計判断を時系列で残す。日々の進捗メモではなく、今後の保守や拡張で前提になる内容だけを書く。

## 2026-04-24 - typewriter rim の body 側座面は微小 clearance で削る

- 結論:
  typewriter rim は visible rim と同じ体積を body から引かず、body 側だけ 0.03 mm 大きい rim clearance volume で座面を削る
- 理由:
  body と rim が同一面を共有すると、preview と export の separate volume 境界で body 色が rim 表面に薄く残るため

## 2026-04-23 - custom-shell のキートップは flat / cylindrical / spherical を切り替え可能にする

- 結論:
  custom-shell のキートップ形状は `topSurfaceShape` で切り替え、`dishDepth` はプラスで凹み、マイナスで盛り上がりとして扱う。cylindrical は固定向きとし、`topPitchDeg` / `topRollDeg` を変えても dish 自体の曲率は維持したまま傾ける
- 理由:
  フラットだけではキートップの触感と見た目の幅が狭く、cylindrical / spherical の一般的な差を小さな UI 拡張で表現できるため

## 2026-04-23 - typewriter のキートップ形状は flat / spherical に限定する

- 結論:
  typewriter shape では `topSurfaceShape` に `flat` と `spherical` だけを出し、state / import でも `cylindrical` は受けず profile default へ丸める
- 理由:
  今回の要件は typewriter へ spherical を追加することであり、custom-shell 向けに定義した cylindrical をそのまま露出すると UI と保存データの意味がぶれるため

## 2026-04-16 - 静的配信前提の採用

- 結論:
  GitHub Pages 前提、クライアントサイド完結の構成で進める
- 理由:
  配信と運用を静的ホスティングだけで閉じたいから

## 2026-04-16 - フロントエンド基盤として Vite を採用

- 結論:
  Vite を採用し、GitHub Pages 用 base は `GITHUB_REPOSITORY` から自動解決する
- 理由:
  ローカル開発と Pages デプロイの両方を単純に扱えるから

## 2026-04-16 - OpenSCAD WASM runtime を同梱

- 結論:
  `public/vendor/openscad/` に OpenSCAD Playground 系の prebuilt WASM runtime を同梱する
- 理由:
  外部依存なしでブラウザ内実行を維持するため

## 2026-04-16 - 3MF はブラウザ側で組み立てる

- 結論:
  OpenSCAD runtime から OFF を出力し、ブラウザ側で 3MF パッケージを生成する
- 理由:
  bundled runtime と整合する export 経路を安定して持つため

## 2026-04-16 - separate volume を基本契約にする

- 結論:
  body / legend を別体積で扱える構造を基本契約とし、色だけに依存しない
- 理由:
  スライサー互換性や製造上の意味づけを安定させやすいため

## 2026-04-16 - SCAD ベース構造を分離

- 結論:
  `scad/base/keycap.scad` を入口として、shell / legend / stem / preset を分離する
- 理由:
  preview / export の責務分離と UI からの bridge を扱いやすくするため

## 2026-04-16 - UI と preview の基本構成

- 結論:
  `src/main.js` を中心に、同じ入力 state から preview と export を駆動する
- 理由:
  入力責務を一元化し、preview と export の不整合を減らすため

## 2026-04-16 - GitHub Pages デプロイフローの固定

- 結論:
  `.github/workflows/deploy-pages.yml` で `npm ci -> npm run build -> deploy` を固定する
- 理由:
  配信経路をリポジトリ内に閉じるため

## 2026-04-18 - 最終ベース形状へ更新

- 結論:
  単純 shell を、最終モデル由来の profile shell / Choc v2 stem / homing bar 構成へ置き換えた
- 理由:
  現実のキーキャップ形状に寄せつつ、モジュール境界を維持するため

## 2026-04-18 - homing bar と legend を分離

- 結論:
  homing bar は body 側オプション、legend は別 volume として並立させる
- 理由:
  触覚マーカーと印字は製造上も UI 上も別責務だから

## 2026-04-18 - `user_*` は wrapper SCAD で注入

- 結論:
  browser runtime の `-D` 上書きに頼らず、実行ごとに wrapper SCAD を生成する
- 理由:
  preview / export の両経路で同じパラメータを確実に反映するため

## 2026-04-18 - legend を `text()` ベースへ移行

- 結論:
  legend は `text()` ベースとし、同梱 font asset の family / face を切り替えて使う
- 理由:
  UI から任意文字列と複数書体を扱えるようにするため

## 2026-04-18 - legend の高さ 0 は flush として扱う

- 結論:
  `文字の高さ = 0` は無効値ではなく、表面と同じ高さで見える状態とする
- 理由:
  エンドユーザ向け UI として意味が分かりやすいため

## 2026-04-18 - top dish に沿う legend 露出

- 結論:
  legend は flat な押し出しをそのまま置かず、dish と同じカーブ帯で切り抜く
- 理由:
  flush legend が body に埋もれて欠けるのを防ぐため

## 2026-04-19 - legend 拡張の優先順位

- 結論:
  複数 top legend より前に、配置面の責務分離を優先する
- 理由:
  現在の legend placement は top dish に密結合しており、side legend の導入ボトルネックになっているため
- 関連:
  [../backlog/legend-extensibility-todo.md](../backlog/legend-extensibility-todo.md)

## 2026-04-21 - 丸みのある legend 書体は OpenSCAD 内で高精細化する

- 結論:
  legend の `text()` は preview / export ごとに `$fn` を上げ、小さい文字サイズでは内部だけ拡大してから縮小する
- 理由:
  bundled OpenSCAD runtime では小さい `text()` が粗く多角形化されやすく、丸みのある書体で角張りが目立ったため
- 関連:
  [../backlog/legend-svg-path-option.md](../backlog/legend-svg-path-option.md)

## 2026-04-21 - legend に擬似的な太らせ補正は入れない

- 結論:
  legend の glyph outline には外周 `offset()` をかけず、選択したフォントの輪郭をそのまま使う
- 理由:
  ユーザーが意図していない太らせが見た目に混ざると、選択したフォントとの差が分かりにくくなるため

## 2026-04-21 - legend の style 選択は font spec を優先する

- 結論:
  bold / italic / slanted のような style は、font が持つ named style や separate face を優先し、擬似 style はユーザー操作なしでは付けない
- 理由:
  選択した font の仕様をそのまま使う方が、見た目の由来が明確で保守しやすいため

## 2026-04-21 - variable font は static face より優先して導入する

- 結論:
  `M PLUS 1 Variable` を同梱し、native style を UI から選べるようにする。static font は font 名検索から face を直接選ぶ
- 理由:
  variable font がある family では、1 ファイルで named style を扱える方が UI と asset 管理を単純化できるため

## 2026-04-21 - 版権依存しない世界観フォントは OFL 配布物を優先する

- 結論:
  映画や漫画の固有ロゴ書体は避け、再配布条件が明確な Google Fonts の `Bangers`、`Creepster`、`Rye`、`Orbitron` を legend 用に同梱する
- 理由:
  GitHub Pages 配信で同梱でき、コミック、ホラー、西部劇、SF の方向性を追加しつつ、権利関係を proprietary franchise font に寄せずに済むため

## 2026-04-21 - Art Gothic 系は近似の OFL 書体で扱う

- 結論:
  `Art Gothic` という固有ファミリー自体は同梱せず、Google Fonts の `Grenze Gotisch` と `MedievalSharp` を近似候補として追加する
- 理由:
  リポジトリ内で再配布条件を明確に保ったまま、`Art Gothic` 検索 needs と gothic display の方向性を満たしたいため

## 2026-04-21 - 外部配布の和文 display font は出典メモを同梱する

- 結論:
  MODI 工場の `黒薔薇シンデレラ` を追加し、配布元 URL と M+ FONTS 派生の注記を `public/fonts/KurobaraCinderella-MODI.txt` に残す
- 理由:
  Google Fonts 配布物ではない日本語 font は参照元が散らばりやすく、ライセンス確認の経路を repo 内に残した方が保守しやすいため

## 2026-04-21 - 明示操作の輪郭補正だけを geometry で許可する

- 結論:
  font-native な style 選択とは別に、`legendOutlineDelta` をユーザー入力の明示操作として提供し、このときだけ `offset()` で輪郭補正する
- 理由:
  native style だけでは足りない微調整 needs を残しつつ、無断補正は避けたいため

## 2026-04-21 - underline は font metadata に従う

- 結論:
  `legendUnderlineEnabled` が有効なときは、font file の `post` / `head` / `hhea` から `UnderlinePosition` / `UnderlineThickness` と line box 中心を読み、center 揃え text の座標へ変換して下線位置と太さを決める。metadata を取得できない場合、任意の固定値へフォールバックしない
- 理由:
  underline も選択した font の仕様に寄せた方が、見た目の由来が明確で、任意の装飾が混ざらないため

## 2026-04-21 - font 選択 UI はブラウザ標準 datalist に依存しない

- 結論:
  font 選択は自前の検索 popover で実装し、虫眼鏡ボタンから検索 textbox と scrollable list を開く。候補は各 font 自身で表示し、入力中にリアルタイム絞り込みする
- 理由:
  datalist では option の見た目制御が弱く、font そのものを preview しながら選ぶ体験を作りにくいため

## 2026-04-22 - shape ごとの editor 初期値は JSON に集約する

- 結論:
  shape ごとの初期値、geometry defaults、表示グループ定義は `src/data/keycap-shapes/*.json` に集約し、`scad/base/keycap.scad` は SCAD 側のフェイルセーフ default を持たず explicit `user_*` を受ける
- 理由:
  editor と SCAD の責務境界を明確にし、shape 追加時の初期値と UI 構成を 1 か所の JSON で保守できるようにするため

## 2026-04-22 - typewriter key rim は separate volume にする

- 結論:
  typewriter shape の key rim は top parameter として扱い、body から flush な seat を差し引いたうえで `rim` part として preview / 3MF へ出す
- 理由:
  rim を body と別色で扱う要件では、色 metadata だけでなく mesh 自体を分離した方が preview / export / slicer の整合を保ちやすいため
