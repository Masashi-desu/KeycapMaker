import test from "node:test";
import assert from "node:assert/strict";
import { parseKeyboardLayouts, getKeyboardKeyCenter, normalizeKeyboardLayout, normalizeKeyboardPlacements } from "../src/lib/keyboard-layout.js";
import { collectKeyboardDirectoryFiles, loadKeyboardFileLayouts, parseGitHubKeyboardUrl, discoverGitHubKeyboardFiles, discoverLocalKeyboardFiles, isKeyboardLayoutJson } from "../src/lib/keyboard-import.js";
import { getKeyboardWorkflow } from "../src/lib/keyboard-ui.js";
import { placeKeyboardMesh, createKeyboardPreviewLayers } from "../src/lib/keyboard-preview.js";
import { createProjectKeycapEntry, createProjectStateWithActiveKeycap, createProjectManifest, parseProjectManifest } from "../src/lib/project-data.js";

const qmk = { keyboard_name: "Test board", layouts: {
  LAYOUT: { layout: [{ matrix: [3, 2], label: "Esc", x: 0.25, y: 0, w: 1.5 }, { matrix: [0, 9], x: 2, y: 0.25 }] },
  ISO: { layout: [{ x: 0, y: 0, w: 1.25, h: 2 }] },
} };

test("JSON drop routing tolerates unrelated and malformed JSON and accepts BOM layouts", () => {
  for (const source of ["{", "null", "42", '{"params":{"name":"Keycap"}}']) {
    assert.equal(isKeyboardLayoutJson(source), false);
  }
  assert.equal(isKeyboardLayoutJson("\uFEFF" + JSON.stringify(qmk)), true);
  assert.equal(isKeyboardLayoutJson('[["A"]]'), true);
  assert.equal(isKeyboardLayoutJson('{"keyboard":"test","layers":[["KC_A"]]}'), true);
});

test("BOM parent QMK definitions remain usable during candidate validation", async () => {
  const sources = {
    "keyboards/test/info.json": "\uFEFF" + JSON.stringify(qmk),
    "keyboards/test/rev1/keyboard.json": '{"keyboard_name":"BOM revision"}',
    "broken.json": "{",
    "unrelated.json": "null",
  };
  const catalog = await discoverLocalKeyboardFiles(Object.entries(sources).map(([name, source]) => ({
    name, size: source.length, text: async () => source,
  })));
  assert.deepEqual(new Set(catalog.candidates), new Set(["keyboards/test/info.json", "keyboards/test/rev1/keyboard.json"]));
  assert.equal((await catalog.load("keyboards/test/rev1/keyboard.json"))[0].keys.length, 2);
});

test("QMK reads physical coordinates independently of electrical matrix and offers layouts", () => {
  const layouts = parseKeyboardLayouts(JSON.stringify(qmk));
  assert.equal(layouts.length, 2);
  assert.equal(layouts[0].keys[0].x, 0.25);
  assert.equal(layouts[0].keys[0].w, 1.5);
  assert.deepEqual(layouts[0].keys[0].matrix, [3, 2]);
  assert.equal(layouts[1].keys[0].h, 2);
});

test("KLE resets key size, retains rotation clusters, skips decals and preserves ISO rectangles", () => {
  const [board] = parseKeyboardLayouts(JSON.stringify([
    { name: "KLE" }, [{ w: 2 }, "A", "B"],
    [{ r: 90, rx: 3, ry: 2 }, "C", { d: true }, "decal", { w: 1.25, h: 2, x2: -0.25, w2: 1.5, h2: 1 }, "Enter"],
  ]));
  assert.equal(board.keys.length, 4);
  assert.equal(board.keys[1].w, 1);
  assert.equal(board.keys[1].x, 2);
  assert.deepEqual(getKeyboardKeyCenter(board.keys[2]), { x: 2.5, y: 2.5 });
  assert.deepEqual(board.keys[3].secondary, { x: -0.25, y: 0, w: 1.5, h: 1 });
});

test("VIA options do not overlap mutually exclusive keys", () => {
  const [first, second] = parseKeyboardLayouts(JSON.stringify({ name: "Via", layouts: { keymap: [["0,0", "0,1\n\n\n0,0", "0,2\n\n\n0,1"]] } }));
  assert.equal(first.keys.length, 2);
  assert.equal(second.keys.length, 2);
  assert.deepEqual(first.keys[1].matrix, [0, 1]);
  assert.deepEqual(second.keys[1].matrix, [0, 2]);
});

test("ZMK includes, overrides, centi units and negative rotations are resolved", async () => {
  const files = {
    "config/test.keymap": '#include "test-layouts.dtsi"\n&physical { keys = <&key_physical_attrs 150 100 225 50 (-3000) 200 0>; };',
    "config/test-layouts.dtsi": '/ { physical: physical { compatible = "zmk,physical-layout"; display-name = "Split"; }; };',
  };
  const [board] = await loadKeyboardFileLayouts("config/test.keymap", { paths: Object.keys(files), readText: async (path) => files[path] });
  assert.equal(board.layoutName, "Split");
  assert.deepEqual([board.keys[0].w, board.keys[0].x, board.keys[0].y, board.keys[0].r], [1.5, 2.25, 0.5, -30]);
});

test("keymaps without physical coordinates and unevaluated ZMK expressions are rejected", () => {
  assert.throws(() => parseKeyboardLayouts('{ "keyboard":"test", "layers":[["KC_A"]] }'), /物理座標/);
  assert.throws(() => parseKeyboardLayouts('/ { layer0 { bindings = <&kp A>; }; };', { path: "test.keymap" }), /物理座標/);
  assert.throws(() => parseKeyboardLayouts('/ { a { keys = <&key_physical_attrs U U 0 0 0 0 0>; }; };', { path: "test.dtsi" }), /不正/);
  assert.throws(() => parseKeyboardLayouts('#if STUDIO\n/ { a { keys = <&key_physical_attrs 100 100 0 0 0 0 0>; }; };\n#endif', { path: "test.dtsi" }), /条件コンパイル/);
});

test("QMK inheritance and Configurator JSON resolve same repository keyboard layouts", async () => {
  const files = {
    "keyboards/test/info.json": JSON.stringify(qmk),
    "keyboards/test/rev1/keyboard.json": '{"keyboard_name":"Revision 1"}',
    "config.json": '{"keyboard":"test/rev1","layout":"LAYOUT","layers":[["KC_A","KC_B"]]}',
  };
  const options = { paths: Object.keys(files), readText: async (path) => files[path] };
  assert.equal((await loadKeyboardFileLayouts("keyboards/test/rev1/keyboard.json", options))[0].keys.length, 2);
  const [board] = await loadKeyboardFileLayouts("config.json", options);
  assert.equal(board.name, "Revision 1");
  assert.deepEqual(board.keys.map((key) => key.label), ["A", "B"]);
});

test("RMK layout handles sizes, gaps and rotated clusters", () => {
  const source = '[layout]\nmap = """\n(0,0,@2u) (0,1)\n[y=0.25] [3] [r=30@(3,1.25)] (1,0)\n"""\n[keymap]\nlayers=1';
  const [board] = parseKeyboardLayouts(source, { path: "keyboard.toml" });
  assert.equal(board.keys[0].w, 2);
  assert.equal(board.keys[1].x, 2);
  assert.deepEqual([board.keys[2].x, board.keys[2].y, board.keys[2].r], [3, 1.25, 30]);
});

test("KiCad reads switch positions in mm, converts rotation and ignores non-switch components", () => {
  const source = '(kicad_pcb (footprint "Switch:MX" (at 38.1 19.05 30) (property "Reference" "SW1")) (footprint "Capacitor:C" (at 1 2) (property "Reference" "C1")) (gr_rect (start 0 0) (end 57.15 38.1) (layer "Edge.Cuts")))';
  const [board] = parseKeyboardLayouts(source, { path: "board.kicad_pcb" });
  assert.equal(board.keys.length, 1);
  assert.deepEqual(getKeyboardKeyCenter(board.keys[0], board.pitchMm), { x: 38.1, y: 19.05 });
  assert.equal(board.keys[0].r, -30);
  assert.equal(board.outline.length, 4);
});

test("malformed coordinates, duplicate slots and active source URLs are rejected or removed", () => {
  const [board] = parseKeyboardLayouts(JSON.stringify(qmk));
  assert.throws(() => normalizeKeyboardLayout({ ...board, keys: [{ ...board.keys[0], x: null }] }), /不正/);
  assert.throws(() => normalizeKeyboardLayout({ ...board, keys: [board.keys[0], board.keys[0]] }), /重複/);
  assert.equal(normalizeKeyboardLayout({ ...board, source: { url: "javascript:alert(1)" } }).source.url, "");
});

test("placements and normalized layout round-trip in project while old projects remain compatible", () => {
  const [keyboard] = parseKeyboardLayouts(JSON.stringify(qmk));
  const keycap = createProjectKeycapEntry({}, { id: "test-keycap" });
  const placements = [
    { slotId: "key-0", keycapId: keycap.id, offsetX: 1.2, offsetY: -0.3, z: 4, rotation: 15 },
    { slotId: "key-1", keycapId: keycap.id },
    { slotId: "missing", keycapId: keycap.id },
  ];
  const project = createProjectStateWithActiveKeycap({ keycaps: [keycap], keyboard, placements });
  const manifest = createProjectManifest(project);
  const restored = parseProjectManifest(JSON.parse(JSON.stringify(manifest)));
  assert.deepEqual(restored.keyboard, keyboard);
  assert.deepEqual(restored.placements, normalizeKeyboardPlacements(placements, keyboard, [keycap]));
  assert.equal(restored.placements.length, 2);
  assert.deepEqual(normalizeKeyboardPlacements(placements, keyboard, []), []);
  delete manifest.keyboard; delete manifest.placements;
  assert.equal(parseProjectManifest(manifest).keyboard, null);
});

test("mounting transform uses rotated key center, inverted board Y and independent height offset", () => {
  const mesh = { vertices: [{ x: 1, y: 0, z: 3 }], faces: [] };
  const key = { x: 0, y: 0, w: 1, h: 1, r: 90, rx: 0, ry: 0 };
  const placed = placeKeyboardMesh(mesh, key, 20, { offsetX: 2, offsetY: 4, z: 5, rotation: 0 });
  assert.ok(Math.abs(placed.vertices[0].x + 8) < 1e-10);
  assert.ok(Math.abs(placed.vertices[0].y + 15) < 1e-10);
  assert.equal(placed.vertices[0].z, 8);
  const [board] = parseKeyboardLayouts(JSON.stringify(qmk));
  const layers = createKeyboardPreviewLayers(board);
  assert.equal(layers.filter((layer) => layer.slotId).length, 2);
});

test("local candidates exclude invalid inputs after resolving includes and QMK inheritance", async () => {
  const sources = {
    "boards/arm/controller.dts": '/ { model = "Controller"; };',
    "config/keymap.keymap": '/ { layer0 { bindings = <&kp A>; }; };',
    "config/physical-base.dtsi": '/ { physical: physical { compatible = "zmk,physical-layout"; display-name = "Resolved"; }; };',
    "config/layouts.dtsi": '#include "physical-base.dtsi"\n&physical { keys = <&key_physical_attrs 100 100 0 0 0 0 0>; };',
    "config/left.overlay": '#include "layouts.dtsi"\n/ { model = "Left"; };',
    "keyboards/test/info.json": JSON.stringify(qmk),
    "keyboards/test/rev1/keyboard.json": '{"keyboard_name":"Revision 1"}',
    "broken.json": '{"layouts":',
    "bad-coordinates.json": '{"layouts":{"LAYOUT":{"layout":[{"x":null,"y":0}]}}}',
  };
  const reads = new Map(), progress = [];
  const files = Object.entries(sources).map(([name, source]) => ({ name, size: source.length, text: async () => {
    reads.set(name, (reads.get(name) || 0) + 1);
    return source;
  } }));
  const catalog = await discoverLocalKeyboardFiles(files, { onProgress: (value) => progress.push(value) });
  assert.deepEqual(new Set(catalog.candidates), new Set([
    "config/layouts.dtsi", "config/left.overlay", "keyboards/test/info.json", "keyboards/test/rev1/keyboard.json",
  ]));
  assert.ok(catalog.paths.includes("config/physical-base.dtsi"));
  assert.equal((await catalog.load("config/left.overlay"))[0].layoutName, "Resolved");
  const layouts = await catalog.load("keyboards/test/rev1/keyboard.json");
  assert.equal(layouts[0].name, "Revision 1");
  assert.equal(layouts[0].keys.length, 2);
  layouts[0].pitchMm = 21;
  assert.equal((await catalog.load("keyboards/test/rev1/keyboard.json"))[0].pitchMm, 19.05);
  assert.ok([...reads.values()].every((count) => count === 1));
  assert.deepEqual(progress.at(-1), { checked: files.length, total: files.length });
});

test("invalid-only catalogs give an explanation and read failures remain errors", async () => {
  const file = (name, source) => ({ name, size: source.length, text: async () => source });
  await assert.rejects(discoverLocalKeyboardFiles([file("controller.dts", "/ { };")]), /物理座標/);
  await assert.rejects(discoverLocalKeyboardFiles([file("controller.dts", "/ { };"), file("broken.json", "{")]), /物理配置の定義/);
  await assert.rejects(discoverLocalKeyboardFiles([
    file("layout.json", JSON.stringify(qmk)),
    { name: "unreadable.json", text: async () => { throw new Error("File permission denied"); } },
  ]), /File permission denied/);
});

test("repository root folders retain nested QMK inheritance and ignore generated directories", async () => {
  const readPaths = [];
  function directory(children, prefix = "") {
    return { kind: "directory", async *entries() {
      for (const [name, source] of Object.entries(children)) {
        const path = prefix ? `${prefix}/${name}` : name;
        yield [name, typeof source === "object" ? directory(source, path) : {
          kind: "file", getFile: async () => {
            readPaths.push(path);
            return { size: source.length, text: async () => source };
          },
        }];
      }
    } };
  }
  const ignored = { "info.json": JSON.stringify(qmk) };
  const root = directory({
    ".git": ignored, ".github": ignored, node_modules: ignored, dist: ignored,
    "README.md": "Repository", "package.json": JSON.stringify(qmk),
    keyboards: { test: { "info.json": JSON.stringify(qmk), rev1: { "keyboard.json": '{"keyboard_name":"Nested revision"}' } } },
  });
  const files = await collectKeyboardDirectoryFiles(root);
  assert.deepEqual(readPaths, ["package.json", "keyboards/test/info.json", "keyboards/test/rev1/keyboard.json"]);
  const catalog = await discoverLocalKeyboardFiles(files);
  assert.deepEqual(new Set(catalog.candidates), new Set(["keyboards/test/info.json", "keyboards/test/rev1/keyboard.json"]));
  const [revision] = await catalog.load("keyboards/test/rev1/keyboard.json");
  assert.equal(revision.name, "Nested revision");
  assert.equal(revision.keys.length, 2);
});

test("folder picker relative paths use the same candidate exclusions as GitHub", async () => {
  const files = ["repo/config/info.json", "repo/node_modules/info.json", "repo/.git/info.json", "repo/package.json"].map((path) => ({
    name: path.split("/").at(-1), webkitRelativePath: path, size: 100,
    text: async () => JSON.stringify(qmk),
  }));
  const catalog = await discoverLocalKeyboardFiles(files);
  assert.deepEqual(catalog.candidates, ["repo/config/info.json"]);
  assert.equal((await catalog.load(catalog.candidates[0]))[0].keys.length, 2);
});

test("workflow gates placement until the new file is selected and skips an unnecessary file step", () => {
  const [board] = parseKeyboardLayouts(JSON.stringify(qmk));
  const state = { project: { keyboard: null }, keyboardStep: 1, keyboardCandidates: [], keyboardLayouts: [] };
  assert.equal(getKeyboardWorkflow(state).step, 1);
  assert.deepEqual(getKeyboardWorkflow(state).steps.map((step) => step.available), [true, false, false]);
  state.project.keyboard = board;
  state.keyboardStep = 2;
  state.keyboardCandidates = ["info.json", "keyboard.json"];
  assert.equal(getKeyboardWorkflow(state).step, 2);
  assert.equal(getKeyboardWorkflow(state).steps[2].available, false);
  state.keyboardLayouts = [board];
  state.keyboardStep = 3;
  assert.equal(getKeyboardWorkflow(state).step, 3);
  assert.ok(getKeyboardWorkflow(state).steps.slice(0, 2).every((step) => step.complete));
  state.keyboardCandidates = ["info.json"];
  assert.equal(getKeyboardWorkflow(state).steps[1].available, false);
  assert.equal(getKeyboardWorkflow(state).step, 3);
  state.keyboardCandidates = [];
  state.keyboardLayouts = [];
  assert.equal(getKeyboardWorkflow(state).step, 3); // Restored project needs no source files.
  state.project.placements = [{ slotId: board.keys[0].id, keycapId: "cap" }];
  state.keyboardStep = 1;
  assert.ok(getKeyboardWorkflow(state).steps.every((step) => step.complete));
  state.keyboardCandidates = ["new-info.json", "new-keyboard.json"];
  state.keyboardStep = 2;
  assert.equal(getKeyboardWorkflow(state).steps[2].complete, false);
});

test("GitHub discovery validates candidates and pins cached file reads to commit SHA", async () => {
  const urls = [];
  const sha = "a".repeat(40);
  const files = { "keyboard.json": JSON.stringify(qmk), "controller.dts": "/ { };", "broken.json": "{" };
  const fetchImpl = async (url) => {
    urls.push(url);
    if (url.endsWith("/repos/user/repo")) return new Response(JSON.stringify({ default_branch: "main" }));
    if (url.endsWith("/commits/main")) return new Response(JSON.stringify({ sha, commit: { tree: { sha: "tree-sha" } } }));
    if (url.includes("/git/trees/")) return new Response(JSON.stringify({ sha: "tree-sha", tree: Object.keys(files).map((path) => ({ type: "blob", mode: "100644", path })) }));
    if (url.includes(`/${sha}/`)) return new Response(files[url.split("/").at(-1)]);
    return new Response("not found", { status: 404 });
  };
  const catalog = await discoverGitHubKeyboardFiles("https://github.com/user/repo", { fetchImpl });
  assert.deepEqual(catalog.candidates, ["keyboard.json"]);
  assert.equal((await catalog.load("keyboard.json"))[0].keys.length, 2);
  assert.equal(urls.filter((url) => url === `https://raw.githubusercontent.com/user/repo/${sha}/keyboard.json`).length, 1);
  assert.throws(() => parseGitHubKeyboardUrl("https://github.com.evil.test/user/repo"), /https/);
  assert.throws(() => parseGitHubKeyboardUrl("file:///tmp/test.json"), /https/);
});

test("GitHub candidate validation reports API limits instead of hiding unreadable files", async () => {
  const sha = "a".repeat(40);
  const fetchImpl = async (url) => {
    if (url.endsWith("/repos/user/repo")) return new Response('{"default_branch":"main"}');
    if (url.endsWith("/commits/main")) return new Response(JSON.stringify({ sha }));
    if (url.includes("/git/trees/")) return new Response(JSON.stringify({ tree: [
      { type: "blob", mode: "100644", path: "keyboard.json" },
      { type: "blob", mode: "100644", path: "unreadable.json" },
    ] }));
    if (url.endsWith("/keyboard.json")) return new Response(JSON.stringify(qmk));
    return new Response("rate limit", { status: 403 });
  };
  await assert.rejects(discoverGitHubKeyboardFiles("https://github.com/user/repo", { fetchImpl }), /利用上限/);
});
