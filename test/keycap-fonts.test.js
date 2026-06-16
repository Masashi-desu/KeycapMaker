import test from "node:test";
import assert from "node:assert/strict";
import {
  clearUserKeycapLegendFonts,
  getUserKeycapLegendFontBytes,
  KEYCAP_LEGEND_FONTS,
  listAvailableKeycapLegendFonts,
  parseKeycapLegendFontNameMetadata,
  registerUserKeycapLegendFont,
  removeUserKeycapLegendFont,
  resolveKeycapLegendFont,
  USER_KEYCAP_LEGEND_FONT_KEY_PREFIX,
} from "../src/lib/keycap-fonts.js";

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

test("ユーザー追加フォントは内蔵フォントとは別に registry へ追加される", () => {
  clearUserKeycapLegendFonts();
  const key = `${USER_KEYCAP_LEGEND_FONT_KEY_PREFIX}0123456789abcdef`;
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const font = registerUserKeycapLegendFont({
    key,
    label: "Local Test Regular",
    fontName: "Local Test",
    fontQuery: "Local Test",
    fileName: "LocalTest-Regular.ttf",
    bytes,
    runtimePath: "/fonts/user/0123456789abcdef.ttf",
  });

  assert.equal(font.key, key);
  assert.equal(font.isUserFont, true);
  assert.equal(resolveKeycapLegendFont(key), font);
  assert.equal(getUserKeycapLegendFontBytes(key), bytes);
  assert.equal(listAvailableKeycapLegendFonts()[0], font);
  assert.equal(KEYCAP_LEGEND_FONTS.length, Object.keys(EXPECTED_LANDING_PAGE_URLS).length);

  assert.equal(removeUserKeycapLegendFont(key), true);
  assert.equal(resolveKeycapLegendFont(key).isMissing, true);
  clearUserKeycapLegendFonts();
});

test("未知の user-font key は未読み込みフォントとして解決する", () => {
  clearUserKeycapLegendFonts();
  const missing = resolveKeycapLegendFont(`${USER_KEYCAP_LEGEND_FONT_KEY_PREFIX}missing`);

  assert.equal(missing.isUserFont, true);
  assert.equal(missing.isMissing, true);
  assert.equal(missing.key, `${USER_KEYCAP_LEGEND_FONT_KEY_PREFIX}missing`);
});

test("不正な font bytes の name metadata は空で返す", () => {
  assert.deepEqual(parseKeycapLegendFontNameMetadata(new Uint8Array([0, 1, 2])), {});
});
