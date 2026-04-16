import "./styles.css";

const app = document.querySelector("#app");

if (!app) {
  throw new Error("#app が見つかりません。");
}

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Keycaps Maker</p>
      <h1>キーキャップ編集 Web アプリの実装基盤</h1>
      <p class="lead">
        GitHub Pages 配信を前提に、OpenSCAD 系ランタイムのブラウザ実行、
        キーキャップ形状のプレビュー、STL / 3MF の PoC を段階的に追加します。
      </p>
    </section>

    <section class="grid">
      <article class="card">
        <h2>現在の状態</h2>
        <ul>
          <li>Task 01: Vite ベースの静的アプリ初期化</li>
          <li>Task 02 以降: OpenSCAD PoC と export 機能を順次追加予定</li>
        </ul>
      </article>

      <article class="card">
        <h2>次に行うこと</h2>
        <ul>
          <li>OpenSCAD WASM ランタイムを導入する</li>
          <li>最小 SCAD をブラウザ内で評価する</li>
          <li>STL と 3MF の PoC を整備する</li>
        </ul>
      </article>
    </section>
  </main>
`;
