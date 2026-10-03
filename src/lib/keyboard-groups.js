// Ownership comes from declared scan matrices and transforms, never key spacing.
function zmkNodes(source) {
  const clean = source.replace(/"(?:\\.|[^"\\])*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (match) => match.startsWith('"') ? match : " ");
  if (/^\s*#\s*(?:if|ifdef|ifndef|elif|else|endif|define|undef|pragma|error|line)\b/m.test(clean)
    || /\/(?:delete-property|delete-node)\//.test(clean)) return new Map();
  const nodes = new Map();
  for (const match of clean.matchAll(/(?:([\w-]+)\s*:\s*)?(&?[\w-]+)\s*\{/g)) {
    let depth = 1, end = match.index + match[0].length;
    for (; end < clean.length && depth; end++) {
      if (clean[end] === "{") depth++;
      if (clean[end] === "}") depth--;
    }
    if (depth) return new Map();
    let body = clean.slice(match.index + match[0].length, end - 1);
    while (/\{[^{}]*\}/.test(body)) body = body.replace(/\{[^{}]*\}/g, "");
    const id = match[1] || match[2].replace(/^&/, "");
    nodes.set(id, `${nodes.get(id) || ""}\n${body}`);
  }
  return nodes;
}

function property(body, name) {
  return [...(body || "").matchAll(new RegExp(`(?:^|[;\\s])${name}\\s*=([^;]*);`, "g"))].at(-1)?.[1]?.trim();
}

function offset(body, name) {
  const value = property(body, name);
  if (value === undefined) return 0;
  const match = /^<\s*(\d+)\s*>$/.exec(value);
  return match ? Number(match[1]) : NaN;
}

function gpioCount(body, name) {
  const value = property(body, name) || "";
  const tuples = [...value.matchAll(/<\s*&[\w-]+\s+\d+\s+[^>]+>/g)];
  return tuples.length && !value.replace(/<\s*&[\w-]+\s+\d+\s+[^>]+>/g, "").replace(/[\s,]/g, "") ? tuples.length : NaN;
}

export function readZmkGroupDescriptions(source, path) {
  const nodes = zmkNodes(source), descriptions = [];
  for (const body of nodes.values()) {
    const keySource = property(body, "keys");
    const transformId = /^<\s*&([\w-]+)\s*>$/.exec(property(body, "transform") || "")?.[1];
    const scanId = /^<\s*&([\w-]+)\s*>$/.exec(property(body, "kscan") || "")?.[1];
    const transform = nodes.get(transformId), scan = nodes.get(scanId);
    if (!keySource || !/"zmk,matrix-transform"/.test(property(transform, "compatible") || "")
      || !/"zmk,kscan-gpio-matrix"/.test(property(scan, "compatible") || "")) continue;
    const keys = [...keySource.matchAll(/<\s*&key_physical_attrs\s+([^>]+)>/g)].map((match) =>
      match[1].replace(/\(\s*([+-]?\d+)\s*\)/g, "$1").trim().split(/\s+/).map(Number));
    if (keySource.replace(/<\s*&key_physical_attrs\s+[^>]+>/g, "").replace(/[\s,]/g, "")
      || !keys.length || keys.some((key) => key.length !== 7 || key.some((v) => !Number.isFinite(v)))) continue;
    const mapSource = property(transform, "map") || "";
    const matrix = [...mapSource.matchAll(/RC\(\s*(\d+)\s*,\s*(\d+)\s*\)/g)].map((match) => [Number(match[1]), Number(match[2])]);
    if (mapSource.replace(/RC\(\s*\d+\s*,\s*\d+\s*\)/g, "").replace(/[\s<>]/g, "") || matrix.length !== keys.length) continue;
    const rowOffset = offset(transform, "row-offset"), colOffset = offset(transform, "col-offset");
    const rows = gpioCount(scan, "row-gpios"), cols = gpioCount(scan, "col-gpios");
    const logicalRows = offset(transform, "rows"), logicalCols = offset(transform, "columns");
    if (![rowOffset, colOffset, rows, cols, logicalRows, logicalCols].every(Number.isFinite) || !logicalRows || !logicalCols
      || matrix.some(([row, col]) => row >= logicalRows || col >= logicalCols)
      || property(scan, "status") === '"disabled"') continue;
    descriptions.push({ path, keys: keys.map(([w, h, x, y, r, rx, ry]) => ({ w: w / 100, h: h / 100, x: x / 100, y: y / 100, r: r / 100, rx: rx / 100, ry: ry / 100 })),
      matrix, rowOffset, colOffset, rows, cols });
  }
  return descriptions;
}

function sameLayout(board, description) {
  return board.keys.length === description.keys.length && board.keys.every((key, index) => {
    const other = description.keys[index];
    return ["w", "h", "x", "y", "r", ...(key.r ? ["rx", "ry"] : [])].every((field) => key[field] === other[field])
      && (!key.matrix || key.matrix.every((v, i) => v === description.matrix[index][i]));
  });
}

export function applyZmkGroups(board, descriptions) {
  const matches = descriptions.filter((description) => sameLayout(board, description));
  // Each side must use the same logical-to-matrix correspondence. Multiple
  // matching definitions for a side or overlapping regions remain unknown.
  if (matches.length < 2 || new Set(matches.map((item) => item.path)).size !== matches.length
    || new Set(matches.map((item) => item.path.split("/").slice(0, -1).join("/"))).size !== 1
    || new Set(matches.map((item) => JSON.stringify(item.matrix))).size !== 1) return board;
  const groups = matches.map(({ path }) => {
    const name = path.split("/").at(-1).replace(/\.(overlay|dts)$/i, "");
    const side = /(?:^|_)left$/i.test(name) ? "left" : /(?:^|_)right$/i.test(name) ? "right" : undefined;
    return { id: `zmk:${path}`, name, ...(side ? { side } : {}), source: { format: "ZMK", path } };
  });
  const keys = board.keys.map((key, index) => {
    const [row, col] = matches[0].matrix[index];
    const owners = matches.flatMap((scan, i) => row >= scan.rowOffset && row < scan.rowOffset + scan.rows
      && col >= scan.colOffset && col < scan.colOffset + scan.cols ? [groups[i].id] : []);
    return { ...key, matrix: [row, col], groupId: owners.length === 1 ? owners[0] : null };
  });
  const used = new Set(keys.map((key) => key.groupId));
  // Do not infer a split from repeated alternative firmware definitions.
  if (groups.filter((group) => used.has(group.id)).length < 2) return board;
  return { ...board, keys, groups: groups.filter((group) => used.has(group.id)) };
}

// A restricted, explicit split declaration only. Expressions and conditional
// firmware configurations that cannot be resolved are left unknown.
export function hasZmkSplitDeclaration(config, defconfig, path = "") {
  const values = [...config.matchAll(/^[ \t]*CONFIG_ZMK_SPLIT[ \t]*=([^\n]*)/gm)];
  if (values.length) return /^\s*y\s*(?:#.*)?$/.test(values.at(-1)[1]);
  const declarations = [...defconfig.matchAll(/^\s*config\s+ZMK_SPLIT\s*\n([\s\S]*?)(?=^\s*(?:config|endif)\b|$(?![\s\S]))/gm)];
  if (declarations.length !== 1) return false;
  const defaults = [...declarations[0][1].matchAll(/^[ \t]*default[ \t]+([^\n]*)/gm)];
  if (defaults.length !== 1 || !/^y\s*(?:#.*)?$/.test(defaults[0][1])
    || /^\s*depends on\b/m.test(declarations[0][1])) return false;
  const shield = `SHIELD_${path.split("/").at(-1).replace(/\.(overlay|dts)$/i, "").toUpperCase()}`;
  const conditions = [];
  for (const line of defconfig.slice(0, declarations[0].index).split("\n")) {
    const condition = /^\s*if\s+(.+?)\s*$/.exec(line)?.[1];
    if (condition) conditions.push(condition);
    if (/^\s*endif\b/.test(line)) conditions.pop();
  }
  return conditions.every((condition) => /^SHIELD_[A-Z0-9_]+(?:\s*\|\|\s*SHIELD_[A-Z0-9_]+)*$/.test(condition)
    && condition.split(/\s*\|\|\s*/).includes(shield));
}

export function applyRmkGroups(board, source, path) {
  const blocks = [...source.matchAll(/^[ \t]*\[\[?split\.(central|peripheral)\]?\][ \t]*(?:#.*)?\n([\s\S]*?)(?=^[ \t]*\[|$(?![\s\S]))/gm)];
  if (blocks.filter((match) => match[1] === "central").length !== 1 || !blocks.some((match) => match[1] === "peripheral")) return board;
  const scans = blocks.map((match, index) => {
    const read = (name) => {
      const values = [...match[2].matchAll(new RegExp(`^[ \\t]*${name}[ \\t]*=([^\\n]*)`, "gm"))];
      const value = values.length === 1 ? /^\s*(\d+)\s*(?:#.*)?$/.exec(values[0][1]) : null;
      return value ? Number(value[1]) : NaN;
    };
    return { id: match[1] === "central" ? "rmk:central" : `rmk:peripheral-${index}`,
      name: match[1] === "central" ? "Central" : `Peripheral ${index}`, rows: read("rows"), cols: read("cols"),
      rowOffset: read("row_offset"), colOffset: read("col_offset") };
  });
  if (scans.some((scan) => ![scan.rows, scan.cols, scan.rowOffset, scan.colOffset].every(Number.isFinite) || !scan.rows || !scan.cols)) return board;
  const keys = board.keys.map((key) => {
    const [row, col] = key.matrix || [];
    const owners = scans.filter((scan) => row >= scan.rowOffset && row < scan.rowOffset + scan.rows && col >= scan.colOffset && col < scan.colOffset + scan.cols);
    return { ...key, groupId: owners.length === 1 ? owners[0].id : null };
  });
  return { ...board, keys, groups: scans.map(({ id, name }) => ({ id, name, source: { format: "RMK", path } })) };
}
