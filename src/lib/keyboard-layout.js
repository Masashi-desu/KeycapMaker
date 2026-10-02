// Physical layouts use key units, top-left origins and clockwise rotation.
// Firmware matrix coordinates are identifiers, never physical coordinates.
export const KEYBOARD_LAYOUT_KIND = "keycap-maker/keyboard";
export const DEFAULT_KEYBOARD_PITCH_MM = 19.05;
export const MAX_LAYOUT_KEYS = 1000;
export const MAX_LAYOUT_FILE_BYTES = 8 * 1024 * 1024;
const NO_POSITIONS = "物理座標がありません。QMK の keyboard.json / info.json、KLE / VIA / Vial の定義、ZMK の keys を持つ layouts.dtsi、RMK の物理 map、または KiCad PCB を指定してください。";

function number(value, fallback) {
  const result = typeof value === "number" ? value : (typeof value === "string" && value.trim() ? Number(value) : NaN);
  if (!Number.isFinite(result) || Math.abs(result) > 100000) {
    if (fallback !== undefined && value == null) return fallback;
    throw new Error("配置の座標・寸法が不正です。");
  }
  return result;
}

function text(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, 500) : fallback;
}

export function normalizeKeyboardLayout(value) {
  if (!value || value.kind !== KEYBOARD_LAYOUT_KIND || value.schemaVersion !== 1 || !Array.isArray(value.keys)) {
    throw new Error("キーボード配置の形式が不正です。");
  }
  if (!value.keys.length || value.keys.length > MAX_LAYOUT_KEYS) throw new Error("配置のキー数は 1〜1000 件にしてください。");
  const seen = new Set();
  const keys = value.keys.map((key, index) => {
    const id = text(key.id, `key-${index}`);
    if (!id || seen.has(id)) throw new Error("配置のキー ID が重複しています。");
    seen.add(id);
    const result = {
      id, label: text(key.label, `${index + 1}`),
      x: number(key.x), y: number(key.y), w: number(key.w, 1), h: number(key.h, 1),
      r: number(key.r, 0), rx: number(key.rx, 0), ry: number(key.ry, 0),
    };
    if (result.w <= 0 || result.h <= 0 || result.w > 100 || result.h > 100) throw new Error("キーの幅・高さが不正です。");
    if (Array.isArray(key.matrix) && key.matrix.length === 2) result.matrix = key.matrix.map((v) => number(v));
    if (key.secondary) {
      result.secondary = Object.fromEntries(["x", "y", "w", "h"].map((field) => [field, number(key.secondary[field])]));
      if (result.secondary.w <= 0 || result.secondary.h <= 0) throw new Error("キーの補助形状が不正です。");
    }
    return result;
  });
  const pitchMm = number(value.pitchMm, DEFAULT_KEYBOARD_PITCH_MM);
  if (pitchMm < 1 || pitchMm > 100) throw new Error("キー間隔は 1〜100 mm にしてください。");
  return {
    kind: KEYBOARD_LAYOUT_KIND, schemaVersion: 1,
    name: text(value.name, "Keyboard"), layoutName: text(value.layoutName, "Default"), pitchMm,
    source: { format: text(value.source?.format), path: text(value.source?.path), url: /^https:\/\//i.test(value.source?.url || "") ? text(value.source.url) : "" },
    keys,
    outline: Array.isArray(value.outline) ? value.outline.slice(0, 4000).map((segment) => {
      if (!Array.isArray(segment) || segment.length !== 4) throw new Error("基板外形が不正です。");
      return segment.map((v) => number(v));
    }) : [],
    warnings: Array.isArray(value.warnings) ? value.warnings.map((v) => text(v)).slice(0, 20) : [],
  };
}

function layout(keys, format, options, name = "Default", extra = {}) {
  return normalizeKeyboardLayout({
    kind: KEYBOARD_LAYOUT_KIND, schemaVersion: 1,
    name: options.name || options.path?.split("/").pop() || "Keyboard", layoutName: name,
    source: { format, path: options.path || "", url: options.url || "" },
    pitchMm: DEFAULT_KEYBOARD_PITCH_MM, keys, ...extra,
  });
}

function parseKle(rows, options, format = "KLE", name = "Default") {
  let x = 0, y = 0, rx = 0, ry = 0, r = 0;
  let alignment = 4;
  const labelMap = [[0,6,2,8,9,11,3,5,1,4,7,10], [1,7,-1,-1,9,11,4,-1,-1,-1,-1,10], [3,-1,5,-1,9,11,-1,-1,4,-1,-1,10], [4,-1,-1,-1,9,11,-1,-1,-1,-1,-1,10], [0,6,2,8,10,-1,3,5,1,4,7,-1], [1,7,-1,-1,10,-1,4,-1,-1,-1,-1,-1], [3,-1,5,-1,10,-1,-1,-1,4,-1,-1,-1], [4,-1,-1,-1,10,-1,-1,-1,-1,-1,-1,-1]];
  const keys = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    let w = 1, h = 1, secondary = {}, decal = false;
    for (const item of row) {
      if (typeof item === "string") {
        const lines = item.split("\n");
        const matrix = /^\s*(\d+),(\d+)\s*$/.exec(lines[labelMap[alignment].indexOf(0)] || "");
        if (!decal) {
          keys.push({ id: `key-${keys.length}`, x, y, w, h, r, rx, ry,
            label: item.replace(/<[^>]*>/g, "").replaceAll("\n", " / ") || `${keys.length + 1}`,
            ...(matrix ? { matrix: [Number(matrix[1]), Number(matrix[2])] } : {}),
            ...(Object.keys(secondary).length ? { secondary: { x: secondary.x ?? 0, y: secondary.y ?? 0, w: secondary.w ?? w, h: secondary.h ?? h } } : {}),
            option: lines[labelMap[alignment].indexOf(8)]?.match(/^\s*(\d+),(\d+)\s*$/)?.slice(1).map(Number),
          });
        }
        x += w; w = 1; h = 1; secondary = {}; decal = false;
      } else if (item && typeof item === "object" && !Array.isArray(item)) {
        if (item.r !== undefined) r = number(item.r);
        if (item.a !== undefined) { alignment = number(item.a); if (!labelMap[alignment]) throw new Error("KLE のラベル配置が不正です。"); }
        if (item.rx !== undefined) { rx = number(item.rx); x = rx; y = ry; }
        if (item.ry !== undefined) { ry = number(item.ry); x = rx; y = ry; }
        x += number(item.x, 0); y += number(item.y, 0);
        if (item.w !== undefined) w = number(item.w);
        if (item.h !== undefined) h = number(item.h);
        for (const field of ["x", "y", "w", "h"]) if (item[`${field}2`] !== undefined) secondary[field] = number(item[`${field}2`]);
        if (item.d !== undefined) decal = Boolean(item.d);
      } else throw new Error("KLE 配置に不正な要素があります。");
    }
    y += 1; x = rx;
  }
  if (!keys.length) throw new Error(NO_POSITIONS);
  // VIA alternatives share matrix addresses. Never render all alternatives on top of one another.
  const groups = [...new Set(keys.filter((key) => key.option).map((key) => key.option[0]))];
  let choices = [{}];
  for (const group of groups) {
    const values = [...new Set(keys.filter((key) => key.option?.[0] === group).map((key) => key.option[1]))];
    choices = choices.flatMap((choice) => values.map((value) => ({ ...choice, [group]: value })));
    if (choices.length > 64) throw new Error("レイアウトの組み合わせが多すぎます。KLE で配置を一つに絞ってください。");
  }
  return choices.map((choice) => layout(keys.filter((key) => !key.option || choice[key.option[0]] === key.option[1]), format, options,
    groups.length ? `${name} (${groups.map((group) => `${group}:${choice[group]}`).join(", ")})` : name));
}

function stripCComments(source) {
  return source.replace(/"(?:\\.|[^"\\])*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (match) => match.startsWith('"') ? match : " ");
}

function parseZmk(source, options) {
  const clean = stripCComments(source);
  if (/^\s*#\s*(?:if|ifdef|ifndef|elif|else|endif)\b/m.test(clean)) {
    throw new Error("ZMK の条件コンパイルを含む定義は、使用する構成の展開済み keys または KLE / QMK 配置を指定してください。");
  }
  const layouts = [];
  // keys can also be supplied later in an &node override, so collect by node label.
  const nodes = new Map();
  const nodePattern = /(?:([\w-]+)\s*:\s*)?(&?[\w-]+)\s*\{/g;
  for (const match of clean.matchAll(nodePattern)) {
    let depth = 1, end = match.index + match[0].length;
    for (; end < clean.length && depth; end += 1) {
      if (clean[end] === "{") depth += 1;
      if (clean[end] === "}") depth -= 1;
    }
    let body = clean.slice(match.index + match[0].length, end - 1);
    // Properties belong to this node, not to any nested child nodes.
    while (/\{[^{}]*\}/.test(body)) body = body.replace(/\{[^{}]*\}/g, "");
    if (!/compatible\s*=\s*"zmk,physical-layout"/.test(body) && !/keys\s*=/.test(body)) continue;
    const id = match[1] || match[2].replace(/^&/, "");
    nodes.set(id, `${nodes.get(id) || ""}\n${body}`);
  }
  for (const [id, body] of nodes) {
    const property = [...body.matchAll(/\bkeys\s*=([\s\S]*?);/g)].at(-1)?.[1];
    if (!property) continue;
    const keys = [];
    for (const match of property.matchAll(/<\s*&key_physical_attrs\s+([^>]+)>/g)) {
      const values = match[1].replace(/\(\s*([+-]?\d+)\s*\)/g, "$1").trim().split(/\s+/);
      if (values.length !== 7) throw new Error("ZMK の key_physical_attrs は 7 個の数値が必要です。");
      const [w, h, x, y, r, rx, ry] = values.map((v) => number(v) / 100);
      keys.push({ id: `key-${keys.length}`, label: `${keys.length + 1}`, w, h, x, y, r, rx, ry });
    }
    if (!keys.length) throw new Error("ZMK の座標にマクロや式が使われています。展開済みの keys、または KLE / QMK 配置を指定してください。");
    if (property.replace(/<\s*&key_physical_attrs\s+[^>]+>/g, "").replace(/[\s,]/g, "")) throw new Error("ZMK の keys に未展開のマクロがあります。展開済みの物理配置を指定してください。");
    const display = /display-name\s*=\s*"([^"]+)"/.exec(body)?.[1] || id;
    layouts.push(layout(keys, "ZMK", options, display));
  }
  if (!layouts.length) throw new Error(NO_POSITIONS);
  return layouts;
}

function section(source, name) {
  const escaped = name.replaceAll(".", "\\.");
  return new RegExp(`^\\[${escaped}\\][ \\t]*(?:#.*)?\\n([\\s\\S]*?)(?=^\\[\\[?[A-Za-z_][\\w.-]*\\]?\\][ \\t]*(?:#.*)?$|$(?![\\s\\S]))`, "m").exec(source)?.[1] || "";
}

function parseRmk(source, options) {
  const block = section(source, "layout");
  const map = /\bmap\s*=\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''|"([^"\n]*)")/.exec(block);
  if (!map) throw new Error(NO_POSITIONS);
  if (/^\s*\[\[layout\.variant\]\]/m.test(source)) throw new Error("RMK の variant は KLE / Vial JSON に変換して読み込んでください。");
  const shapes = new Map();
  for (const match of section(source, "layout.shapes").matchAll(/([\w.]+)\s*=\s*\{([^}]+)\}/g)) {
    const shape = {};
    for (const field of match[2].matchAll(/(\w+)\s*=\s*([+-]?[\d.]+)/g)) shape[field[1]] = number(field[2]);
    shapes.set(match[1], shape);
  }
  const keys = [];
  let y = 0, r = 0, rx = 0, ry = 0;
  for (const line of (map[1] ?? map[2] ?? map[3]).trim().split("\n")) {
    let x = 0;
    const tokens = line.match(/\[[^\]]+\]|\([^)]*\)/g) || [];
    if (line.replace(/\[[^\]]+\]|\([^)]*\)/g, "").trim()) throw new Error("RMK map に未対応の記法があります。");
    for (const token of tokens) {
      if (token.startsWith("[")) {
        const rotation = /^\[r=([+-]?[\d.]+)(?:@\(([+-]?[\d.]+),\s*([+-]?[\d.]+)\))?\]$/.exec(token);
        if (rotation) { r = number(rotation[1]); rx = number(rotation[2], 0); ry = number(rotation[3], 0); }
        else if (token.startsWith("[y=")) y += number(token.slice(3, -1));
        else x += number(token.slice(1, -1));
        continue;
      }
      const fields = token.slice(1, -1).split(",").map((v) => v.trim());
      if (fields[0] === "e") { x += 1; continue; }
      const shapeName = fields.find((v) => v.startsWith("@"))?.slice(1);
      const stockWidth = /^(\d+(?:\.\d+)?)u$/.exec(shapeName || "");
      let shape = shapes.get(shapeName) || (stockWidth ? { w: Number(stockWidth[1]) } : {});
      if (shapeName === "2u_tall") shape = { w: 1, h: 2 };
      if (shapeName === "stepped_caps") shape = { w: 1.75 };
      if (shapeName && !shapes.has(shapeName) && !stockWidth && !["2u_tall", "stepped_caps"].includes(shapeName)) throw new Error(`RMK shape ${shapeName} は KLE / Vial JSON に変換して読み込んでください。`);
      const key = { id: `key-${keys.length}`, label: `${fields[0]},${fields[1]}`, matrix: fields.slice(0, 2).map((v) => number(v)),
        x: x + (shape.x || 0), y: y + (shape.y || 0), w: shape.w ?? 1, h: shape.h ?? 1, r, rx, ry };
      if (shape.r) {
        const center = rotatePoint(key.x + key.w / 2, key.y + key.h / 2, r, rx, ry);
        key.x = center.x - key.w / 2; key.y = center.y - key.h / 2;
        key.r += shape.r; key.rx = center.x; key.ry = center.y;
      }
      if (shape.w2) key.secondary = { x: shape.x2 || 0, y: shape.y2 || 0, w: shape.w2, h: shape.h2 ?? 1 };
      keys.push(key); x += shape.w ?? 1;
    }
    y += 1;
  }
  return [layout(keys, "RMK", options)];
}

function parseSexpr(source) {
  const tokens = source.match(/"(?:\\.|[^"\\])*"|[()]|[^\s()]+/g) || [];
  const root = [], stack = [root];
  for (const token of tokens) {
    if (token === "(") {
      if (stack.length > 100) throw new Error("KiCad データの入れ子が深すぎます。");
      const child = []; stack.at(-1).push(child); stack.push(child);
    } else if (token === ")") {
      if (stack.length === 1) throw new Error("KiCad ファイルが不正です。");
      stack.pop();
    } else stack.at(-1).push(token.startsWith('"') ? token.slice(1, -1).replace(/\\(["\\])/g, "$1") : token);
  }
  if (stack.length !== 1) throw new Error("KiCad ファイルが不正です。");
  return root[0];
}

function parseKicad(source, options) {
  const board = parseSexpr(source);
  if (board?.[0] !== "kicad_pcb") throw new Error("KiCad PCB ではありません。");
  const child = (node, name) => node.find((v) => Array.isArray(v) && v[0] === name);
  const keys = [], outline = [];
  const pitch = DEFAULT_KEYBOARD_PITCH_MM;
  const point = (node, name) => child(node, name)?.slice(1, 3).map((v) => number(v) / pitch);
  for (const node of board.filter(Array.isArray)) {
    if (["footprint", "module"].includes(node[0])) {
      const reference = node.find((v) => Array.isArray(v) && ((v[0] === "property" && v[1] === "Reference") || (v[0] === "fp_text" && v[1] === "reference")))?.[2] || "";
      if (!/^SW\d/i.test(reference) && !/switch|(?:^|[_:/])(?:MX|Choc)(?:[_:/]|$)/i.test(node[1])) continue;
      const at = child(node, "at");
      if (!at) continue;
      const x = number(at[1]) / pitch, y = number(at[2]) / pitch;
      keys.push({ id: `key-${keys.length}`, label: reference || `${keys.length + 1}`, x: x - 0.5, y: y - 0.5, w: 1, h: 1,
        r: -number(at[3], 0), rx: x, ry: y });
    }
    if (!node[0].startsWith("gr_") || child(node, "layer")?.[1] !== "Edge.Cuts") continue;
    const start = point(node, "start"), end = point(node, "end");
    if (node[0] === "gr_line" && start && end) outline.push([...start, ...end]);
    if (node[0] === "gr_rect" && start && end) {
      const corners = [start, [end[0], start[1]], end, [start[0], end[1]]];
      corners.forEach((p, i) => outline.push([...p, ...corners[(i + 1) % 4]]));
    }
    if (node[0] === "gr_poly") {
      const points = (child(node, "pts") || []).slice(1).filter(Array.isArray).map((p) => p.slice(1, 3).map((v) => number(v) / pitch));
      points.forEach((p, i) => outline.push([...p, ...points[(i + 1) % points.length]]));
    }
    if (node[0] === "gr_circle" && end) {
      const center = point(node, "center");
      const radius = Math.hypot(end[0] - center[0], end[1] - center[1]);
      for (let i = 0; i < 64; i += 1) {
        const a = i * Math.PI / 32, b = (i + 1) * Math.PI / 32;
        outline.push([center[0] + radius * Math.cos(a), center[1] + radius * Math.sin(a), center[0] + radius * Math.cos(b), center[1] + radius * Math.sin(b)]);
      }
    }
  }
  if (!keys.length) throw new Error("KiCad PCB にスイッチの footprint が見つかりません。SW 番号または Switch / MX / Choc の footprint を使ってください。");
  return [layout(keys, "KiCad", options, "PCB", { outline, warnings: ["スイッチの footprint 原点を取り付け中心として使用しています。キーサイズは 1u として読み込みます。基板外形は線・矩形・多角形・円に対応します。"] })];
}

export function isKeyboardLayoutFileName(path) {
  return /\.(json|dtsi|dts|overlay|keymap|toml|kicad_pcb)$/i.test(path);
}

export function parseKeyboardLayouts(source, options = {}) {
  if (typeof source !== "string" || source.length > MAX_LAYOUT_FILE_BYTES) throw new Error("配置ファイルは 8 MiB 以下にしてください。");
  const path = options.path || "layout.json";
  if (/\.kicad_pcb$/i.test(path) || source.trimStart().startsWith("(kicad_pcb")) return parseKicad(source, options);
  if (/\.(dtsi|dts|overlay|keymap)$/i.test(path)) return parseZmk(source, options);
  if (/\.toml$/i.test(path)) return parseRmk(source, options);
  const payload = JSON.parse(source.replace(/^\uFEFF/, ""));
  if (payload?.kind === KEYBOARD_LAYOUT_KIND) return [normalizeKeyboardLayout(payload)];
  if (Array.isArray(payload)) return parseKle(payload, { ...options, name: payload[0]?.name || options.name });
  if (Array.isArray(payload?.layouts?.keymap)) {
    return parseKle(payload.layouts.keymap, { ...options, name: payload.name || options.name }, /vial/i.test(path) ? "Vial" : "VIA");
  }
  const layouts = Object.entries(payload?.layouts || {}).filter(([, value]) => Array.isArray(value?.layout));
  if (layouts.length) return layouts.map(([name, value]) => layout(value.layout.map((key, index) => ({
    id: `key-${index}`, label: key.label || `${index + 1}`, ...key,
  })), "QMK", { ...options, name: payload.keyboard_name || options.name }, name));
  throw new Error(NO_POSITIONS);
}

export function rotatePoint(x, y, degrees = 0, rx = 0, ry = 0) {
  const angle = degrees * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  return { x: rx + (x - rx) * cos - (y - ry) * sin, y: ry + (x - rx) * sin + (y - ry) * cos };
}

export function getKeyboardKeyCenter(key, pitchMm = 1) {
  const point = rotatePoint(key.x + key.w / 2, key.y + key.h / 2, key.r, key.rx, key.ry);
  return { x: point.x * pitchMm, y: point.y * pitchMm };
}

export function getKeyboardKeyCorners(key, secondary = false) {
  const rect = secondary ? key.secondary : { x: 0, y: 0, w: key.w, h: key.h };
  if (!rect) return [];
  return [[0, 0], [rect.w, 0], [rect.w, rect.h], [0, rect.h]].map(([x, y]) =>
    rotatePoint(key.x + rect.x + x, key.y + rect.y + y, key.r, key.rx, key.ry));
}

export function getKeyboardBounds(keyboard) {
  const points = keyboard.keys.flatMap((key) => [...getKeyboardKeyCorners(key), ...getKeyboardKeyCorners(key, true)]);
  points.push(...keyboard.outline.flatMap(([x, y, x2, y2]) => [{ x, y }, { x: x2, y: y2 }]));
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

export function normalizeKeyboardPlacements(placements, keyboard, keycaps) {
  if (!keyboard) return [];
  const slots = new Set(keyboard.keys.map((key) => key.id));
  const caps = new Set(keycaps.map((keycap) => keycap.id));
  const seen = new Set();
  return (Array.isArray(placements) ? placements : []).filter((entry) => {
    if (!entry || !slots.has(entry.slotId) || !caps.has(entry.keycapId) || seen.has(entry.slotId)) return false;
    seen.add(entry.slotId); return true;
  }).map((entry) => ({ slotId: entry.slotId, keycapId: entry.keycapId,
    offsetX: number(entry.offsetX, 0), offsetY: number(entry.offsetY, 0), z: number(entry.z, 0), rotation: number(entry.rotation, 0) }));
}
