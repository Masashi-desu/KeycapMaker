# キーキャップ編集 Web アプリ 実行計画

## この文書の役割

この文書は、本リポジトリにおける実装作業の主導線です。以後の作業は、原則としてこの文書を上から順に実施してください。背景知識や比較情報は別資料に分離していますが、実行順序の判断はこの文書を基準にします。

## 固定前提

- 配信先は GitHub Pages とし、サーバーサイド処理を前提にしない
- 動的処理はクライアントサイドで実行する
- ブラウザ内で OpenSCAD 系の実行基盤を利用する前提で検証を進める
- 3MF 出力は成立可能性があるが、安定運用できるかは未確定
- 色付き 3MF は不安定要素があるため、PoC 結果次第では別体積方式を正式採用する
- 本番設計では「本体」と「印字」を別体積として扱える構成を有力候補とする
- プレビュー用と export 用は責務分離を意識して設計する
- `text()` 利用時のフォント依存は後続タスクで明示的に扱う

## 進め方

- 各タスクは `目的 -> 作業内容 -> 完了条件` の順で確認する
- 実際の判断結果は [../specs/decision-log.md](../specs/decision-log.md) に残す
- プロジェクト前提に変更が出た場合は [../specs/project-scope.md](../specs/project-scope.md) を更新する
- 背景知識が必要な場合は `research/` 配下を参照する
- 各タスクの `作業内容` は、原則として `Codex が先に実施 -> 人間に依頼 -> Codex が記録` の順で読む

## 実施主体の見方

- `Codex:` リポジトリ内の編集、ローカルコマンド実行、PoC 実装、文書更新、判断材料の整理を担当する
- `人間:` GUI アプリの手動確認、Bambu Studio での読み込み確認、GitHub リポジトリ設定、ライセンスや運用方針の最終確認を担当する
- `人間:` の項目がないタスクは、原則として Codex が連続実施してよい
- `人間:` の項目があるタスクでは、人間の結果を受け取ったあとに Codex が `decision-log.md` や関連文書へ反映してから次タスクへ進む

---

## Task 01. プロジェクト初期化

**目的**

GitHub Pages 向けの静的 Web アプリとして実装を始められる最小構成を整え、以後の PoC を実行できる開発土台を用意する。

**作業内容**

1. `Codex:` フロントエンドの基盤を選定する。特段の阻害要因がなければ、静的ホスティングと相性のよい一般的なビルド構成を採用する。
2. `Codex:` `package.json`、ローカル開発コマンド、ビルドコマンド、成果物出力先を追加する。
3. `Codex:` `src/` にアプリのエントリポイント、`public/` に静的アセット置き場を整備する。
4. `Codex:` 最小ページを作り、`npm run dev` 相当のローカル起動で画面が表示できることを確認する。
5. `人間:` ローカル起動した画面をブラウザで開き、初期表示に大きな崩れがないかを確認する。見た目の違和感や要望があれば、そのまま Codex に返す。
6. `Codex:` GitHub Pages 配信時のベースパス要件を確認し、採用した開発基盤とあわせて [../specs/project-scope.md](../specs/project-scope.md) と [../specs/decision-log.md](../specs/decision-log.md) に記録する。

**完了条件**

- ローカルで静的ページが表示できる
- `src/` と `public/` の責務が実ファイルとして成立している
- 採用した開発基盤とベースパス方針が文書に残っている

**関連資料**

- [../specs/project-scope.md](../specs/project-scope.md)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 02. OpenSCAD ブラウザ実行 PoC

**目的**

ブラウザ内で OpenSCAD 系ランタイムを動かし、クライアントサイドだけで形状生成を始められるかを確認する。

**作業内容**

1. `Codex:` [../research/technical-direction.md](../research/technical-direction.md) を参照し、候補となるブラウザ実行基盤を 1 つ選ぶ。
2. `Codex:` [../../scad/samples/minimum-poc.scad](../../scad/samples/minimum-poc.scad) を使い、ブラウザ上で SCAD を評価する最小 PoC を実装する。
3. `Codex:` ランタイム初期化時間、バンドルサイズ、エラー出力の取り回しを確認する。
4. `人間:` ブラウザ上で PoC を操作し、初回起動の待ち時間や操作感が許容範囲かを確認する。違和感があれば症状をそのまま Codex に返す。
5. `Codex:` 採用候補が失敗した場合は、失敗理由を [../specs/decision-log.md](../specs/decision-log.md) に記録したうえで次候補へ切り替える。このタスクでは、まず単純形状の実行確認を優先し、フォント依存の `text()` は未着手でもよい。

**完了条件**

- ブラウザ内で SCAD から何らかの形状生成結果を得られる
- 候補ランタイムの採用可否を記録できている
- クライアントサイド実行のみで PoC が成立するか判断できる

**関連資料**

- [../research/technical-direction.md](../research/technical-direction.md)
- [../../scad/samples/minimum-poc.scad](../../scad/samples/minimum-poc.scad)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 03. STL 出力 PoC

**目的**

ブラウザ実行した SCAD から STL を出力できるかを確認し、最低限のエクスポート経路を先に確保する。

**作業内容**

1. `Codex:` Task 02 の PoC を拡張し、ブラウザ内で STL データを生成してダウンロードできるようにする。
2. `Codex:` `minimum-poc.scad` のような単純サンプルを使い、生成時間とファイルサイズの傾向を記録する。
3. `人間:` 生成した STL を一般的なビューアまたはスライサーで開き、寸法、向き、メッシュ破綻の有無を確認する。
4. `Codex:` 人間から受け取った確認結果を [../specs/decision-log.md](../specs/decision-log.md) に記録し、STL を最低保証形式として使えそうかをまとめる。

**完了条件**

- ブラウザから STL をダウンロードできる
- ダウンロードした STL を外部ツールで開ける
- STL が最低限の出力形式として使える見込みを判断できる

**関連資料**

- [../research/export-format-notes.md](../research/export-format-notes.md)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 04. 3MF 出力 PoC

**目的**

3MF をクライアントサイドのみで安定生成できるかを確認し、本番候補として残せるかを判断する。

**作業内容**

1. `Codex:` 3MF を直接生成できるか、あるいはブラウザ内で完結する変換経路を構成できるかを調べる。
2. `Codex:` 実装候補がある場合は、Task 03 と同じサンプル形状で 3MF を出力する。
3. `Codex:` 単一ボディだけでなく、複数ボディを含む構成が扱えるかも確認する。
4. `Codex:` 安定したクライアントサイド経路が作れない場合は、無理に本採用せず「不採用または保留」として記録し、Task 05 以降は STL と別体積方式を優先する。

**完了条件**

- 3MF の成立可否を明確に記録できている
- 成立する場合は生成経路と制約が分かっている
- 成立しない場合でも、次タスクへ進む代替方針が明確になっている

**関連資料**

- [../research/technical-direction.md](../research/technical-direction.md)
- [../research/export-format-notes.md](../research/export-format-notes.md)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 05. Bambu Studio 読み込み確認

**目的**

PoC で生成した STL / 3MF を Bambu Studio に読み込み、実運用に必要な互換性を確認する。

**作業内容**

1. `Codex:` 人間が確認に使うサンプル STL / 3MF、確認観点、返答してほしい項目を整理する。
2. `人間:` Task 03 の STL を Bambu Studio に読み込み、寸法、向き、メッシュ異常の有無を確認する。
3. `人間:` Task 04 で 3MF が生成できた場合は、Bambu Studio での認識結果を確認する。複数ボディがある場合は、別オブジェクトとして扱われるか、色やパーツの扱いが維持されるかも確認する。
4. `Codex:` 読み込み結果を [../specs/decision-log.md](../specs/decision-log.md) に記録する。
5. `Codex:` 3MF が想定どおり読めない場合は、Task 06 で別体積方式を正式候補として扱う前提に切り替える。

**完了条件**

- Bambu Studio での読み込み結果を記録できている
- STL と 3MF のどちらが実運用しやすいか判断材料が揃っている
- 次の正式判断に必要な情報が不足なく残っている

**関連資料**

- [../research/export-format-notes.md](../research/export-format-notes.md)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 06. 色付き 3MF または別体積方式の判断

**目的**

PoC の結果を踏まえ、本番設計で採用する出力戦略を決める。

**作業内容**

1. `Codex:` Task 04 と Task 05 の結果を見て、色付き 3MF を正式採用できるか評価する。
2. `Codex:` 少しでも不安定要素が残る場合は、色指定だけに依存せず「本体ボディ」と「印字ボディ」を別体積で扱う方式を正式候補とする。
3. `人間:` Codex がまとめた比較結果を読み、製造運用上の都合で明確な希望があれば伝える。希望がなければ、Codex の安全側提案を採用してよい。
4. `Codex:` 正式方針を [../specs/project-scope.md](../specs/project-scope.md) と [../specs/decision-log.md](../specs/decision-log.md) に記録する。
5. `Codex:` export の標準出力を決める。候補は `body.stl + legend.stl` のような別体積出力、または安定性が確認できた 3MF 多ボディ出力とする。preview 用と export 用の責務分離方針も同時に文章化する。

**完了条件**

- 本番で採用する出力戦略が文章で明確になっている
- 色付き 3MF を採用しない場合の理由が残っている
- 以後の SCAD 実装が迷わない判断基準ができている

**関連資料**

- [../research/export-format-notes.md](../research/export-format-notes.md)
- [../research/scad-design-guidelines.md](../research/scad-design-guidelines.md)
- [../specs/project-scope.md](../specs/project-scope.md)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 07. キーキャップ用 SCAD ベース実装

**目的**

本番のキーキャップ生成に必要な SCAD 構造を作り、body / legend 分離を前提にしたベース実装を整える。

**作業内容**

1. `Codex:` `scad/base/` にキーキャップ全体の基礎形状と export 用エントリを実装する。
2. `Codex:` `scad/modules/` に stem、legend、profile 差分などの再利用モジュールを分離する。
3. `Codex:` `scad/presets/` にキー種別やプロフィールごとの初期値を定義する。
4. `Codex:` preview 用の軽量形状と export 用の正規形状を分ける。必要なら `preview_model()` と `export_body()` / `export_legend()` のように責務を分ける。
5. `人間:` `text()` を使う場合は、採用したいフォント候補とライセンス上の制約を確認する。業務上の指定フォントがある場合は Codex に伝える。
6. `Codex:` フォントファイルの同梱方法、配信場所、印字を別体積で扱う場合の座標基準、厚み、交差許容を明文化する。

**完了条件**

- 1 つ以上のキーキャップサンプルを SCAD だけで生成できる
- body と legend を別々に出力または合成できる構造になっている
- preview と export の責務分離がコード上でも文書上でも成立している

**関連資料**

- [../research/scad-design-guidelines.md](../research/scad-design-guidelines.md)
- [../specs/project-scope.md](../specs/project-scope.md)
- [../../scad/README.md](../../scad/README.md)

---

## Task 08. パラメータ編集 UI 実装

**目的**

ブラウザ上でキーキャップのパラメータを編集し、SCAD 生成へ渡す UI を実装する。

**作業内容**

1. `Codex:` `src/` にアプリ状態を定義し、profile、stem、legend、寸法、プリセット選択の入力項目を設計する。
2. `Codex:` パラメータの責務を UI 用、SCAD 生成用、export 用で分ける。
3. `Codex:` 無効な値を UI 側で防ぐため、型とバリデーションを明示する。
4. `Codex:` 現時点で色指定を UI に置く場合も、色だけに依存しない出力戦略と矛盾しないようにする。
5. `人間:` 実際に UI を触り、入力項目の意味が分かるか、必須パラメータに不足がないかを確認する。
6. `Codex:` 人間のフィードバックを反映し、少なくとも 1 つのプリセットから編集してプレビュー更新まで到達できるようにする。

**完了条件**

- ブラウザ UI から主要パラメータを編集できる
- 編集結果を SCAD 実行基盤へ受け渡せる
- UI の入力責務と SCAD の幾何責務が混ざっていない

**関連資料**

- [../research/scad-design-guidelines.md](../research/scad-design-guidelines.md)
- [../specs/glossary.md](../specs/glossary.md)
- [../../src/README.md](../../src/README.md)

---

## Task 09. プレビュー改善

**目的**

実用的な操作感を得るために、プレビュー表示を改善し、重い export 処理と切り分ける。

**作業内容**

1. `Codex:` プレビュー更新の頻度と重さを測定し、必要に応じて簡略形状やキャッシュを導入する。
2. `Codex:` export 実行中に UI が固まる場合は、処理分離の方針を検討する。
3. `Codex:` preview と export の入力差分を明確にし、不要な高精度計算をプレビューで避ける。
4. `Codex:` 視点、ズーム、簡易陰影など、キーキャップ形状の確認に必要な最低限の操作性を整える。
5. `人間:` UI を触って、反応速度、視認性、操作の迷いどころを確認する。違和感は主観のまま返してよい。
6. `Codex:` `text()` や複雑な legend が重い場合は、preview 専用の簡略表現を設計し、人間から受けた違和感も反映する。

**完了条件**

- UI 操作に追従するプレビューが成立している
- export と preview の責務分離が実装でも説明できる
- 重い処理の原因と対策が記録されている

**関連資料**

- [../research/scad-design-guidelines.md](../research/scad-design-guidelines.md)
- [../specs/decision-log.md](../specs/decision-log.md)

---

## Task 10. GitHub Pages デプロイ整備

**目的**

GitHub Pages 上で静的 Web アプリとして配信し、クライアントサイドだけで主要機能が動く状態を整える。

**作業内容**

1. `Codex:` ビルド成果物を GitHub Pages へ公開する設定を整える。
2. `Codex:` `.github/workflows/` にデプロイ用ワークフローを追加する。
3. `Codex:` リポジトリ名を含むベースパス、アセット参照、Wasm やフォント配信パスを確認する。
4. `人間:` GitHub リポジトリ設定で Pages 公開に必要な確認や有効化を行い、デプロイ後の URL で初期表示、プレビュー、PoC 済み export が動作するかを確認する。
5. `Codex:` 人間の確認結果を反映し、サーバーサイド依存が混入していないかを再確認する。

**完了条件**

- GitHub Pages 上でアプリにアクセスできる
- クライアントサイドだけで主要フローが動作する
- デプロイ手順と運用手順がリポジトリ内に残っている

**関連資料**

- [../specs/project-scope.md](../specs/project-scope.md)
- [../../.github/workflows/README.md](../../.github/workflows/README.md)

---

## Task 11. 運用・今後の拡張

**目的**

以後の継続開発で迷わないよう、運用ルール、拡張方針、未解決課題を整理する。

**作業内容**

1. `Codex:` 新しい key profile、stem 方式、legend 表現を追加する手順を文書化する。
2. `Codex:` フォント同梱ルール、ライセンス確認手順、`text()` 依存の注意点を整理する。
3. `Codex:` 回帰確認に使う SCAD サンプルや UI サンプルを `scad/samples/` などへ追加する。
4. `Codex:` export 形式、Bambu Studio での運用前提、制約事項を README と `docs/specs/` に反映する。
5. `人間:` 今後の拡張候補の優先度や、製造・運用上の重点項目を Codex に伝える。
6. `Codex:` 受け取った優先度をもとに、今後の拡張候補を `docs/roadmap/` または `docs/specs/` に残す。

**完了条件**

- 新規作業者が本リポジトリだけで次の拡張に着手できる
- 運用ルールと未解決課題の所在が明確になっている
- ドキュメント更新先が分からない状態を解消できている

**関連資料**

- [../specs/decision-log.md](../specs/decision-log.md)
- [../specs/project-scope.md](../specs/project-scope.md)
- [../specs/glossary.md](../specs/glossary.md)

---

## 最初に着手するタスク

最初に着手するタスクは **Task 01. プロジェクト初期化** です。Task 01 を完了するまでは、PoC 実装や SCAD 本実装へ進まないでください。
