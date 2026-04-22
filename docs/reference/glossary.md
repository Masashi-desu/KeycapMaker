# 用語集

## body

キーキャップ本体の主要体積。

## body_core

body から homing bar を除いた基礎ボリューム。preview / export の part 分離で使う。

## rim / key rim

typewriter shape のキートップ外周を覆う別体積パーツ。body と別色で扱える。

## legend

キーキャップ上の印字や記号を表す形状。

## homing bar

F / J キーのような触覚マーカー。legend とは別責務で body 側オプションとして扱う。

## separate volume / 別体積方式

body / rim / legend を別 body として保持し、出力形式やスライサー側で独立に扱えるようにする設計方針。

## preview

ブラウザ上で編集結果を即時確認するための表示経路。反応速度を優先する。

## export

3MF や編集データ JSON を生成する経路。part 構造や保存契約を優先する。

## profile

キーキャップの高さ、傾き、上面形状など、全体形状の系統。

## preset

shape JSON や sample fixture のように、パラメータの組み合わせをまとめた定義。現在の editor 初期値は `src/data/keycap-shapes/*.json` が持つ。

## stem

キーキャップ裏面の取り付け形状。
