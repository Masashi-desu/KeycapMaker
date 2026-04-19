# 判断記録

採用済みの設計判断を時系列で残す。日々の進捗メモではなく、今後の保守や拡張で前提になる内容だけを書く。

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
  legend は `text()` ベースとし、`M PLUS 1p`、`M PLUS Rounded 1c`、`DotGothic16` を同梱する
- 理由:
  UI から任意文字列と複数書体を扱えるようにするため

## 2026-04-18 - legend 装飾はフォント非依存で表現

- 結論:
  太字、イタリック風、ななめ、下線は追加フォントではなく 2D 形状操作で表現する
- 理由:
  書体ごとの差を減らし、同じ UI を維持するため

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
