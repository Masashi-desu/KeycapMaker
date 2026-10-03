import { isKeyboardLayoutFileName, MAX_LAYOUT_FILE_BYTES, parseKeyboardLayouts } from "./keyboard-layout.js";
import { applyZmkGroups, hasZmkSplitDeclaration, readZmkGroupDescriptions } from "./keyboard-groups.js";

class KeyboardFileReadError extends Error {}
const NO_VALID_FILES = "読み込み可能な物理配置の定義が見つかりません。キー位置の座標を含む配置ファイルを指定してください。";
const IGNORED_LAYOUT_DIRECTORIES = new Set([".git", ".github", "node_modules", "vendor", "target", "dist"]);

function isIgnoredLayoutPath(path) {
  return path.split("/").slice(0, -1).some((part) => IGNORED_LAYOUT_DIRECTORIES.has(part));
}

async function createValidatedCatalog({ paths, candidates, readText, sourceUrl = () => "", onProgress }) {
  const layoutCache = new Map();
  const structureCache = new Map();
  const getLayouts = (path) => {
    if (!layoutCache.has(path)) layoutCache.set(path, loadKeyboardFileLayouts(path, { paths, readText, structureCache, url: sourceUrl(path) }));
    return layoutCache.get(path);
  };
  const valid = new Set();
  const invalid = new Map();
  let nextIndex = 0, checked = 0, readError;
  // Resolve dependencies before deciding validity; an override may inherit its coordinates.
  // Bound parallel reads and reuse both source files and parsed layouts when a candidate is selected.
  await Promise.all(Array.from({ length: Math.min(4, candidates.length) }, async () => {
    while (nextIndex < candidates.length && !readError) {
      const path = candidates[nextIndex++];
      try {
        await getLayouts(path);
        valid.add(path);
      } catch (error) {
        if (error instanceof KeyboardFileReadError) readError = error;
        else invalid.set(path, error);
      }
      onProgress?.({ checked: ++checked, total: candidates.length });
    }
  }));
  // A network/permission failure cannot establish that a layout is invalid.
  if (readError) throw readError;
  const verifiedCandidates = candidates.filter((path) => valid.has(path));
  if (!verifiedCandidates.length) throw candidates.length === 1 ? invalid.get(candidates[0]) : new Error(NO_VALID_FILES);
  return { paths, candidates: verifiedCandidates, load: async (path) => structuredClone(await getLayouts(path)) };
}

function normalizePath(path) {
  const result = [];
  for (const part of String(path).replaceAll("\\", "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") { if (!result.length) return ""; result.pop(); }
    else result.push(part);
  }
  return result.join("/");
}

function mergeJson(base, next) {
  if (!base || !next || typeof base !== "object" || typeof next !== "object" || Array.isArray(base) || Array.isArray(next)) return next;
  const result = { ...base };
  for (const [key, value] of Object.entries(next)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) continue;
    result[key] = mergeJson(base[key], value);
  }
  return result;
}

export function isKeyboardLayoutJson(source) {
  try {
    const payload = JSON.parse(source.replace(/^\uFEFF/, ""));
    return Boolean(Array.isArray(payload) || payload?.kind === "keycap-maker/keyboard"
      || payload?.layouts || (payload?.keyboard && payload?.layers));
  } catch {
    // Routing a drop must not reject unrelated JSON before candidate validation.
    return false;
  }
}

// These standard ZMK includes define attrs/macros or input processors, not a
// board's scan membership. Any other unresolved include prevents ownership.
const ZMK_STRUCTURE_INCLUDES = new Set([
  "dt-bindings/zmk/matrix_transform.h", "physical_layouts.dtsi",
  "dt-bindings/zmk/input_transform.h", "input/processors.dtsi",
]);

async function expandZmkFile(path, content, paths, readText, { structural = false } = {}) {
  const visited = new Set();
  let unresolved = false;
  async function expand(currentPath, source, depth = 0) {
    if (visited.has(currentPath)) return "";
    if (depth > 20 || visited.size > 64) throw new Error("ZMK include が多すぎます。展開済みの配置を指定してください。");
    visited.add(currentPath);
    let included = "";
    for (const match of source.matchAll(/^\s*#include\s*[<"]([^>"]+)[>"]/gm)) {
      const relative = normalizePath(`${currentPath.split("/").slice(0, -1).join("/")}/${match[1]}`);
      const exact = paths.includes(relative) ? relative : paths.includes(match[1]) ? match[1] : "";
      const suffixes = paths.filter((p) => p.endsWith(`/${match[1]}`));
      const target = exact || (suffixes.length === 1 ? suffixes[0] : "");
      if (!target && !ZMK_STRUCTURE_INCLUDES.has(match[1])) unresolved = true;
      if (target && !visited.has(target)) included += await expand(target, await readText(target), depth + 1);
    }
    return `${included}\n${source}`;
  }
  const expanded = await expand(path, content);
  return structural && unresolved ? null : expanded;
}

async function getZmkGroups(paths, readText, cache) {
  if (!cache.has("zmk")) cache.set("zmk", (async () => {
    const sidePaths = paths.filter((path) => /\.(overlay|dts)$/i.test(path));
    if (sidePaths.length > 64) return [];
    const descriptions = [];
    for (const path of sidePaths) {
      const directory = path.split("/").slice(0, -1).join("/");
      if (sidePaths.filter((other) => other.split("/").slice(0, -1).join("/") === directory).length < 2) continue;
      const configPath = path.replace(/\.(overlay|dts)$/i, ".conf");
      const defconfigPath = directory ? `${directory}/Kconfig.defconfig` : "Kconfig.defconfig";
      const config = paths.includes(configPath) ? await readText(configPath) : "";
      const defconfig = paths.includes(defconfigPath) ? await readText(defconfigPath) : "";
      if (!hasZmkSplitDeclaration(config, defconfig, path)) continue;
      const expanded = await expandZmkFile(path, await readText(path), paths, readText, { structural: true });
      if (expanded === null) return [];
      const side = readZmkGroupDescriptions(expanded, path);
      if (!side.length) return [];
      descriptions.push(...side);
    }
    return descriptions;
  })().catch((error) => {
    if (error instanceof KeyboardFileReadError) throw error;
    // Unsupported structural dependencies do not invalidate physical positions.
    return [];
  }));
  return cache.get("zmk");
}

export async function loadKeyboardFileLayouts(path, { readText, paths = [], url = "", structureCache = new Map() }) {
  const content = await readText(path);
  const enrich = async (layouts) => {
    const descriptions = await getZmkGroups(paths, readText, structureCache);
    return layouts.map((board) => board.groups.length ? board : applyZmkGroups(board, descriptions));
  };
  if (/\.(dtsi|dts|overlay|keymap)$/i.test(path)) {
    return enrich(parseKeyboardLayouts(await expandZmkFile(path, content, paths, readText), { path, url }));
  }
  if (/\.json$/i.test(path)) {
    const original = JSON.parse(content.replace(/^\uFEFF/, ""));
    // QMK definitions inherit hardware/layout data from parent keyboard directories.
    let payload = original;
    let keyboardPath = path.split("/").slice(0, -1).join("/");
    if (original.keyboard && Array.isArray(original.layers)) keyboardPath = `keyboards/${original.keyboard}`;
    if (/\/(?:info|keyboard)\.json$/i.test(path) || original.keyboard && Array.isArray(original.layers)) {
      payload = {};
      const segments = keyboardPath.split("/");
      const first = segments.indexOf("keyboards");
      for (let i = first < 0 ? 1 : first + 2; i <= segments.length; i += 1) {
        for (const name of ["info.json", "keyboard.json"]) {
          const ancestor = `${segments.slice(0, i).join("/")}/${name}`;
          if (paths.includes(ancestor)) payload = mergeJson(payload, JSON.parse((await readText(ancestor)).replace(/^\uFEFF/, "")));
        }
      }
      payload = mergeJson(payload, original);
    }
    let layouts = parseKeyboardLayouts(JSON.stringify(payload), { path, url });
    if (original.keyboard && original.layout && Array.isArray(original.layers)) {
      const selected = layouts.find((item) => item.layoutName === original.layout);
      if (selected) {
        const legends = original.layers[0] || [];
        selected.keys.forEach((key, index) => { key.label = String(legends[index] || key.label).replace(/^KC_/, ""); });
        layouts = [selected];
      }
    }
    return enrich(layouts);
  }
  return parseKeyboardLayouts(content, { path, url });
}

export function parseGitHubKeyboardUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("GitHub のリポジトリ・フォルダ・ファイル URL を入力してください。"); }
  if (url.protocol !== "https:" || url.username || url.password || !["github.com", "www.github.com", "raw.githubusercontent.com"].includes(url.hostname)) {
    throw new Error("https://github.com/ または https://raw.githubusercontent.com/ の URL を入力してください。");
  }
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const [owner, repo] = parts;
  if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) throw new Error("GitHub のリポジトリ URL が不正です。");
  const raw = url.hostname === "raw.githubusercontent.com";
  const mode = raw ? "blob" : parts[2] || "repo";
  if (!["repo", "tree", "blob"].includes(mode)) throw new Error("リポジトリ直下、tree、blob または raw の URL を指定してください。");
  const tail = raw ? parts.slice(2) : parts.slice(3);
  if (mode !== "repo" && !tail.length) throw new Error("ブランチまたはファイルの指定がありません。");
  return { owner, repo: repo.replace(/\.git$/, ""), mode, tail };
}

async function request(url, fetchImpl, asJson = false) {
  let response;
  try { response = await fetchImpl(url, { credentials: "omit", signal: AbortSignal.timeout(20000) }); }
  catch (error) { throw new KeyboardFileReadError(error.message, { cause: error }); }
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw new KeyboardFileReadError("GitHub API の利用上限に達しました。時間をおくか、ファイルをダウンロードしてドロップしてください。");
    if (response.status === 404) throw new KeyboardFileReadError("GitHub の公開リポジトリ・ブランチ・ファイルが見つかりません。");
    throw new KeyboardFileReadError(`GitHub 読み込みに失敗しました (${response.status})。`);
  }
  if (Number(response.headers?.get("content-length")) > MAX_LAYOUT_FILE_BYTES) throw new Error("GitHub の応答が 8 MiB を超えています。フォルダまたはファイル URL を指定してください。");
  let source;
  try { source = await response.text(); }
  catch (error) { throw new KeyboardFileReadError(error.message, { cause: error }); }
  if (source.length > MAX_LAYOUT_FILE_BYTES) throw new Error("GitHub の応答が 8 MiB を超えています。");
  return asJson ? JSON.parse(source) : source;
}

function candidate(path) {
  if (isIgnoredLayoutPath(path)) return false;
  if (/\.(dtsi|dts|overlay|keymap|kicad_pcb)$/i.test(path)) return true;
  if (/(?:^|\/)keyboard\.toml$/i.test(path)) return true;
  return /\.json$/i.test(path) && !/(?:package(?:-lock)?|tsconfig|manifest|settings|compile_commands)\.json$/i.test(path);
}

export async function discoverGitHubKeyboardFiles(value, { fetchImpl = globalThis.fetch, onProgress } = {}) {
  const target = parseGitHubKeyboardUrl(value);
  const api = `https://api.github.com/repos/${target.owner}/${target.repo}`;
  const meta = await request(api, fetchImpl, true);
  let ref = meta.default_branch, prefix = "", commit;
  if (target.mode === "repo") {
    commit = await request(`${api}/commits/${encodeURIComponent(ref)}`, fetchImpl, true);
  } else {
    // Resolve the longest valid ref so branches containing '/' work as well.
    let found = false;
    for (let i = Math.min(target.tail.length, 12); i >= 1; i -= 1) {
      const possibleRef = target.tail.slice(0, i).join("/");
      try {
        commit = await request(`${api}/commits/${encodeURIComponent(possibleRef)}`, fetchImpl, true);
        ref = possibleRef; prefix = target.tail.slice(i).join("/"); found = true; break;
      } catch (error) {
        if (!error.message.includes("見つかりません")) throw error;
      }
    }
    if (!found) throw new Error("GitHub のブランチ・タグが見つかりません。");
  }
  let tree = await request(`${api}/git/trees/${commit.sha}?recursive=1`, fetchImpl, true);
  if (tree.truncated && prefix) {
    const directory = target.mode === "blob" ? prefix.split("/").slice(0, -1).join("/") : prefix;
    let treeSha = commit.commit.tree.sha;
    for (const segment of directory.split("/").filter(Boolean)) {
      const children = await request(`${api}/git/trees/${treeSha}`, fetchImpl, true);
      treeSha = children.tree.find((item) => item.type === "tree" && item.path === segment)?.sha;
      if (!treeSha) throw new Error("GitHub のフォルダが見つかりません。");
    }
    tree = await request(`${api}/git/trees/${treeSha}?recursive=1`, fetchImpl, true);
    tree.tree = tree.tree.map((entry) => ({ ...entry, path: `${directory}/${entry.path}` }));
  }
  if (tree.truncated) throw new Error("リポジトリの一覧が省略されました。キーボードのフォルダ URL を指定するか、配置ファイルを直接ドロップしてください。");
  const paths = tree.tree.filter((entry) => entry.type === "blob" && entry.mode !== "120000").map((entry) => entry.path);
  const candidates = paths.filter((path) => target.mode === "blob" ? path === prefix : (!prefix || path.startsWith(`${prefix}/`)) && candidate(path));
  if (!candidates.length) throw new Error("読み込み可能な配置ファイルが見つかりません。物理レイアウトの JSON / layouts.dtsi / keyboard.toml / KiCad PCB を指定してください。");
  const cache = new Map();
  // Pin raw reads to this tree's SHA: files and dependencies always describe the same revision.
  const rawBase = `https://raw.githubusercontent.com/${target.owner}/${target.repo}/${commit.sha}`;
  const readText = (path) => {
    if (!paths.includes(path)) throw new Error(`配置の参照ファイルが見つかりません: ${path}`);
    if (!cache.has(path)) cache.set(path, request(`${rawBase}/${path.split("/").map(encodeURIComponent).join("/")}`, fetchImpl));
    return cache.get(path);
  };
  return createValidatedCatalog({
    paths, candidates: candidates.sort((a, b) => score(b) - score(a) || a.localeCompare(b)),
    readText, sourceUrl: (path) => `https://github.com/${target.owner}/${target.repo}/blob/${commit.sha}/${path}`, onProgress,
  });
}

function score(path) {
  if (/-layouts\.dtsi$/i.test(path)) return 50;
  if (/keyboard\.json$/i.test(path)) return 40;
  if (/vial\.json$/i.test(path)) return 35;
  if (/info\.json$/i.test(path)) return 30;
  if (/\.kicad_pcb$/i.test(path)) return 25;
  return 0;
}

export async function discoverLocalKeyboardFiles(files, { onProgress } = {}) {
  const byPath = new Map(files.filter((file) => {
    const path = file.webkitRelativePath || file.name;
    return isKeyboardLayoutFileName(path) && !isIgnoredLayoutPath(path);
  }).map((file) => [file.webkitRelativePath || file.name, file]));
  const paths = [...byPath.keys()];
  const cache = new Map();
  const readText = (path) => {
    const file = byPath.get(path);
    if (!file) throw new Error(`参照ファイルが見つかりません: ${path}`);
    if (file.size > MAX_LAYOUT_FILE_BYTES) throw new Error("配置ファイルは 8 MiB 以下にしてください。");
    if (!cache.has(path)) cache.set(path, Promise.resolve().then(() => file.text()).catch((error) => { throw new KeyboardFileReadError(error.message, { cause: error }); }));
    return cache.get(path);
  };
  return createValidatedCatalog({ paths, candidates: paths.filter(candidate).sort((a, b) => score(b) - score(a) || a.localeCompare(b)), readText, onProgress });
}

export async function collectKeyboardDirectoryFiles(handle) {
  const files = [];
  async function collect(directory, prefix = "", depth = 0) {
    if (depth > 20) throw new Error("フォルダが大きすぎます。配置を含む小さいフォルダを指定してください。");
    for await (const [name, child] of directory.entries()) {
      if (IGNORED_LAYOUT_DIRECTORIES.has(name)) continue;
      const path = prefix ? `${prefix}/${name}` : name;
      if (child.kind === "directory") await collect(child, path, depth + 1);
      else if (isKeyboardLayoutFileName(name)) {
        if (files.length >= 2000) throw new Error("フォルダが大きすぎます。配置を含む小さいフォルダを指定してください。");
        const file = await child.getFile();
        files.push({ name: path, webkitRelativePath: path, size: file.size, text: () => file.text() });
      }
    }
  }
  await collect(handle);
  return files;
}
