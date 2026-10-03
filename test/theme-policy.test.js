import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const sourceRoot = new URL("../src/", import.meta.url);
const namedColors = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/));

function declarations(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=[{;])\s*([\w-]+)\s*:\s*([^;{}]*)(?=;|})/g)]
    .map((match) => ({ property: match[1], value: match[2].trim() }));
}

function fixedColor(value) {
  const unquoted = value.replace(/url\([^)]*\)|"[^"]*"|'[^']*'/g, "").replace(/--[\w-]+/g, "");
  if (/#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b/i.test(unquoted)) return true;
  if (/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\((?!\s*var\()/i.test(unquoted)) return true;
  return (unquoted.match(/[a-z]+/gi) ?? []).some((word) => namedColors.has(word.toLowerCase()));
}

async function cssFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) files.push(...await cssFiles(url));
    else if (entry.name.endsWith(".css")) files.push(url);
  }
  return files;
}

test("UI palette defines every token in both themes with valid references", async () => {
  const css = await readFile(new URL("theme.css", sourceRoot), "utf8");
  const blocks = [...css.matchAll(/(:root[^{}]*)\{([^{}]*)\}/g)];
  const themes = {};
  for (const [name, selector] of [["light", ':root[data-theme="light"]'], ["dark", ':root[data-theme="dark"]']]) {
    const matches = blocks.filter((block) => block[1].includes(selector));
    assert.equal(matches.length, 1, `${name}: one explicit palette block is required`);
    const tokens = declarations(`{${matches[0][2]}}`).filter(({ property }) => property.startsWith("--"));
    assert.ok(tokens.length > 0, `${name}: palette is not empty`);
    assert.equal(new Set(tokens.map(({ property }) => property)).size, tokens.length, `${name}: duplicate token`);
    themes[name] = new Map(tokens.map(({ property, value }) => [property, value]));
    for (const { property, value } of tokens) {
      assert.ok(value, `${name}: ${property} has a value`);
      for (const reference of value.matchAll(/var\((--[\w-]+)/g)) {
        assert.ok(themes[name].has(reference[1]), `${name}: ${property} references missing ${reference[1]}`);
      }
    }
  }
  assert.deepEqual([...themes.light.keys()].sort(), [...themes.dark.keys()].sort());
});

test("component styles use theme tokens without fixed UI colors or palette overrides", async () => {
  const themeUrl = new URL("theme.css", sourceRoot);
  const palette = new Set(declarations(await readFile(themeUrl, "utf8")).map(({ property }) => property));
  for (const file of await cssFiles(sourceRoot)) {
    if (file.href === themeUrl.href) continue;
    const css = await readFile(file, "utf8");
    for (const { property, value } of declarations(css)) {
      assert.equal(fixedColor(value), false, `${file.pathname}: ${property}: ${value} must use a theme token`);
      assert.equal(palette.has(property), false, `${file.pathname}: ${property} belongs in theme.css`);
    }
  }
});

test("fixed-color check distinguishes theme expressions from literal colors", () => {
  for (const value of ["#fff", "#94392d", "rgb(20 30 40 / .5)", "rgba(0, 0, 0, .3)", "hsl(20 30% 40%)", "oklch(50% .2 20)", "color(display-p3 1 0 0)", "1px solid red", "linear-gradient(white, transparent)", "color-mix(in srgb, var(--panel) 80%, black)"]) {
    assert.equal(fixedColor(value), true, value);
  }
  for (const value of ["var(--text)", "rgb(var(--shadow-rgb) / .2)", "color-mix(in srgb, var(--danger-text) 12%, var(--panel) 88%)", "currentColor", "transparent", "inherit", '"Black"', "var(--field-color, var(--panel))"]) {
    assert.equal(fixedColor(value), false, value);
  }
  assert.deepEqual(declarations(".sample { color: red; background: white; border: 1px solid #fff; }"), [
    { property: "color", value: "red" }, { property: "background", value: "white" }, { property: "border", value: "1px solid #fff" },
  ]);
});
