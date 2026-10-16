#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const REPO_ROOT = fileURLToPath(new URL("../", import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;
const FONT_URL = "https://cdn.jsdelivr.net/npm/@fontsource-variable/manrope@5.3.0/files/manrope-latin-wght-normal.woff2";
const FONT_SHA256 = "a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972";

async function downloadFont() {
  const response = await fetch(FONT_URL, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Font download failed: HTTP ${response.status}`);
  const font = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(font).digest("hex") !== FONT_SHA256) {
    throw new Error("The CDN font does not match the pinned SHA-256; review its source before updating it.");
  }
  return font.toString("base64");
}

function lightPalette(stylesheet) {
  const light = stylesheet.match(/:root\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/u)?.[1];
  if (!light) throw new Error("Cannot find the light theme palette.");
  const color = (token) => {
    const value = light.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6});`, "iu"))?.[1];
    if (!value) throw new Error(`Cannot resolve theme color: ${token}`);
    return value;
  };
  return {
    background: color("panel"),
    text: color("text"),
    muted: color("muted"),
    pill: color("panel-soft"),
    border: color("border"),
    pillText: color("segment-text"),
  };
}

function cardHtml(icon, font, colors) {
  return `<!doctype html>
<html lang="en">
<meta charset="UTF-8">
<title>KeycapMaker Open Graph image</title>
<style>
  @font-face {
    font-family: "Manrope";
    src: url("data:font/woff2;base64,${font}") format("woff2");
    font-style: normal;
    font-weight: 200 800;
    font-display: block;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; }
  body { background: ${colors.background}; font-family: "Manrope", sans-serif; }
  main { width: 100%; height: 100%; display: grid; place-items: center; }
  .brand { display: flex; align-items: center; gap: 64px; }
  .mark, .mark svg { display: block; width: 300px; height: 300px; flex: none; }
  .copy { display: flex; flex-direction: column; align-items: flex-start; }
  h1 { margin: 0; color: ${colors.text}; font-size: 86px; font-weight: 800; line-height: 1.1; letter-spacing: -3.8px; }
  p { margin: 18px 0 0; color: ${colors.muted}; font-size: 32px; font-weight: 500; line-height: 1.4; letter-spacing: -0.6px; }
  ul { display: flex; gap: 10px; padding: 0; margin: 30px 0 0; list-style: none; }
  li { border: 1px solid ${colors.border}; border-radius: 999px; background: ${colors.pill}; padding: 8px 18px; color: ${colors.pillText}; font-size: 17px; font-weight: 600; line-height: 1.2; white-space: nowrap; }
</style>
<main>
  <div class="brand">
    <div class="mark">${icon}</div>
    <div class="copy">
      <h1>KeycapMaker</h1>
      <p>Let's make custom keycaps.</p>
      <ul aria-label="Supported file formats"><li>.3mf</li><li>.stl</li><li>.step</li><li>project file</li></ul>
    </div>
  </div>
</main>
</html>`;
}

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" } } });
  const output = path.resolve(REPO_ROOT, values.output ?? "public/og-image.png");
  const [font, icon, stylesheet] = await Promise.all([
    downloadFont(),
    fs.readFile(path.join(REPO_ROOT, "public/favicon.svg"), "utf8"),
    fs.readFile(path.join(REPO_ROOT, "src/theme.css"), "utf8"),
  ]);
  const browser = await chromium.launch({ headless: true });
  let png;
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      locale: "en-US",
      timezoneId: "UTC",
    });
    await page.setContent(cardHtml(icon, font, lightPalette(stylesheet)));
    await page.evaluate(async () => {
      await Promise.all([500, 600, 800].map((weight) => document.fonts.load(`${weight} 32px "Manrope"`)));
      await document.fonts.ready;
      if (!document.fonts.check('800 86px "Manrope"') || document.fonts.size !== 1) {
        throw new Error("Manrope did not load; refusing to render with a fallback font.");
      }
      const brand = document.querySelector(".brand").getBoundingClientRect();
      if (brand.left < 64 || brand.right > 1136 || brand.top < 64 || brand.bottom > 566) {
        throw new Error("The Open Graph content exceeds the card's safe margins.");
      }
    });
    png = await page.screenshot({ type: "png", animations: "disabled" });
  } finally {
    await browser.close();
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  try {
    await fs.writeFile(temporary, png);
    await fs.rename(temporary, output);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  console.log(`Generated ${path.relative(REPO_ROOT, output)} (${WIDTH}×${HEIGHT}; Manrope 5.3.0 from CDN).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
