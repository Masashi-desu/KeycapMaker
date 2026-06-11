import test from "node:test";
import assert from "node:assert/strict";
import { KEYCAP_LEGEND_FONTS } from "../src/lib/keycap-fonts.js";

const EXPECTED_LANDING_PAGE_URLS = Object.freeze({
  "mplus1-variable": "https://fonts.google.com/specimen/M%2BPLUS%2B1",
  "mplus1p-regular": "https://fonts.google.com/specimen/M%2BPLUS%2B1p",
  "noto-sans-variable": "https://fonts.google.com/noto/specimen/Noto%2BSans",
  "noto-sans-jp-variable": "https://fonts.google.com/noto/specimen/Noto%2BSans%2BJP",
  "mplusrounded1c-regular": "https://fonts.google.com/specimen/M%2BPLUS%2BRounded%2B1c",
  "dotgothic16-regular": "https://fonts.google.com/specimen/DotGothic16",
  "kurobara-cinderella-regular": "https://modi.jpn.org/font_kurobara-cinderella.php",
  "bangers-regular": "https://fonts.google.com/specimen/Bangers",
  "creepster-regular": "https://fonts.google.com/specimen/Creepster",
  "rye-regular": "https://fonts.google.com/specimen/Rye",
  "orbitron-regular": "https://fonts.google.com/specimen/Orbitron",
  "grenzegotisch-regular": "https://fonts.google.com/specimen/Grenze%2BGotisch",
  "medievalsharp-regular": "https://fonts.google.com/specimen/MedievalSharp",
});

test("印字フォントはユーザー向けLP URLを持つ", () => {
  assert.equal(KEYCAP_LEGEND_FONTS.length, Object.keys(EXPECTED_LANDING_PAGE_URLS).length);

  for (const font of KEYCAP_LEGEND_FONTS) {
    assert.equal(font.landingPageUrl, EXPECTED_LANDING_PAGE_URLS[font.key], `${font.key} landing page URL`);
    assert.equal(new URL(font.landingPageUrl).protocol, "https:");
  }
});
