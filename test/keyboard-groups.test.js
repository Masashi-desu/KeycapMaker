import test from "node:test";
import { createSplitKeyboardFixture } from "./support/keyboard-group-fixture.js";
import assert from "node:assert/strict";
import { parseKeyboardLayouts, normalizeKeyboardLayout } from "../src/lib/keyboard-layout.js";
import { loadKeyboardFileLayouts, discoverLocalKeyboardFiles } from "../src/lib/keyboard-import.js";
import { createProjectManifest, parseProjectManifest, createProjectKeycapEntry, createProjectStateWithActiveKeycap } from "../src/lib/project-data.js";


test("ZMK structural ownership uses scan ranges despite reversed XY and keeps unmapped slots unknown", async () => {
  const { load } = createSplitKeyboardFixture();
  const [board] = await load();
  assert.deepEqual(board.groups.map((group) => group.side), ["left", "right"]);
  assert.deepEqual(board.keys.map((key) => key.groupId), [board.groups[0].id, board.groups[1].id, null, board.groups[0].id]);
  assert.deepEqual(board.keys.map((key) => key.matrix), [[0, 0], [0, 2], [0, 7], [0, 1]]);
  const [overlay] = await load("boards/test/test_right.overlay");
  assert.deepEqual(overlay.keys.map((key) => key.groupId), board.keys.map((key) => key.groupId));
  const entry = createProjectKeycapEntry({}, { id: "cap" });
  const project = createProjectStateWithActiveKeycap({ keycaps: [entry], keyboard: board });
  assert.deepEqual(parseProjectManifest(createProjectManifest(project)).keyboard, board);
});

test("partial, disabled, conditional and ambiguous ZMK definitions do not establish ownership", async () => {
  const cases = [
    (f) => delete f["boards/test/test_right.overlay"],
    (f) => { f["boards/test/test_right.conf"] = "CONFIG_ZMK_SPLIT=n\n"; },
    (f) => { f["boards/test/test_right.conf"] = "CONFIG_ZMK_SPLIT=UNRESOLVED\n"; },
    (f) => { f["boards/test/Kconfig.defconfig"] += "\nconfig ZMK_SPLIT\n default n\n"; },
    (f) => { f["boards/test/Kconfig.defconfig"] = f["boards/test/Kconfig.defconfig"].replace("default y", "default y\n default n"); },
    (f) => { f["boards/test/Kconfig.defconfig"] = "if SOME_UNRESOLVED_FLAG\nconfig ZMK_SPLIT\n default y\nendif\n"; },
    (f) => { f["boards/test/test_right.overlay"] = f["boards/test/test_right.overlay"].replace("col-offset = <2>", "col-offset = <OFFSET>"); },
    (f) => { f["boards/test/test_right.overlay"] += '\n#include "missing-hardware.dtsi"\n'; },
    (f) => { f["boards/test/test_right.overlay"] += '\n#ifdef UNKNOWN\n&scan { col-gpios = <&gpio 0 GPIO_ACTIVE_HIGH>; };\n#endif\n'; },
    (f) => { f["boards/test/test_right.overlay"] += '\n&scan { /delete-property/ col-gpios; };\n'; },
    (f) => { f["boards/test/test_right.overlay"] += '\n#define RC(r,c) ((r)*16+(c))\n'; },
    (f) => { f["boards/test/test_right.overlay"] = f["boards/test/test_right.overlay"].replace("columns = <8>", "columns = <2>"); },
    (f) => { f["boards/test/alternate.overlay"] = f["boards/test/test_right.overlay"]; f["boards/test/alternate.conf"] = "CONFIG_ZMK_SPLIT=y\n"; },
    (f) => { f["boards/test/alternate.overlay"] = "#include <unresolved-hardware.dtsi>"; f["boards/test/alternate.conf"] = "CONFIG_ZMK_SPLIT=y\n"; },
    (f) => { f["boards/test/test_right.overlay"] = f["boards/test/test_right.overlay"].replace("RC(0,2)", "RC(0,3)"); },
  ];
  for (const mutate of cases) {
    const { files, load } = createSplitKeyboardFixture(); mutate(files);
    const [board] = await load();
    assert.deepEqual(board.groups, []);
    assert.ok(board.keys.every((key) => key.groupId === null));
  }
});

test("unrelated duplicate ZMK layouts cannot be selected by geometric similarity", async () => {
  const { files, load } = createSplitKeyboardFixture();
  for (const [path, source] of Object.entries(files)) if (path.startsWith("boards/test/")) files[path.replace("boards/test/", "boards/other/")] = source;
  const [board] = await load();
  assert.deepEqual(board.groups, []);
});

test("local discovery retains split config dependencies without offering them as layouts", async () => {
  const { files } = createSplitKeyboardFixture();
  const catalog = await discoverLocalKeyboardFiles(Object.entries(files).map(([name, source]) => ({ name, size: source.length, text: async () => source })));
  assert.ok(catalog.paths.includes("boards/test/Kconfig.defconfig"));
  assert.ok(!catalog.candidates.includes("boards/test/Kconfig.defconfig"));
  const [board] = await catalog.load("config/info.json");
  assert.equal(board.groups.length, 2);
});

test("RMK explicitly maps central and peripheral ownership; overlaps and uncovered positions are unknown", () => {
  const layout = '[layout]\nmap = """(0,0) (0,2) (0,7)"""\n';
  const source = layout + '[split.central]\nrows=1\ncols=2\nrow_offset=0\ncol_offset=0\n[[split.peripheral]]\nrows=1\ncols=2\nrow_offset=0\ncol_offset=2\n';
  const [board] = parseKeyboardLayouts(source, { path: "keyboard.toml" });
  assert.deepEqual(board.keys.map((key) => key.groupId), ["rmk:central", "rmk:peripheral-1", null]);
  const [indented] = parseKeyboardLayouts(source.replace(/^(rows|cols|row_offset|col_offset)/gm, "  $1"), { path: "keyboard.toml" });
  assert.deepEqual(indented.keys.map((key) => key.groupId), board.keys.map((key) => key.groupId));
  const [duplicate] = parseKeyboardLayouts(source.replace("col_offset=2", "col_offset=2\ncol_offset=4"), { path: "keyboard.toml" });
  assert.deepEqual(duplicate.groups, []);
  const [overlap] = parseKeyboardLayouts(source.replace("col_offset=2", "col_offset=0"), { path: "keyboard.toml" });
  assert.ok(overlap.keys.every((key) => key.groupId === null));
  const [incomplete] = parseKeyboardLayouts(source.replace("row_offset=0\ncol_offset=2", "col_offset=2"), { path: "keyboard.toml" });
  assert.deepEqual(incomplete.groups, []);
});

test("coordinates, KLE rotation clusters, names and a QMK split flag alone never establish ownership", () => {
  for (const input of [[[{ rx: 0, ry: 0 }, "Left"], [{ rx: 20, ry: 0 }, "Right"]], { split: { enabled: true }, layouts: { LAYOUT: { layout: [{ x: 0, y: 0, matrix: [0, 0] }, { x: 20, y: 0, matrix: [4, 0] }] } } }]) {
    const [board] = parseKeyboardLayouts(JSON.stringify(input));
    assert.deepEqual(board.groups, []);
    assert.ok(board.keys.every((key) => key.groupId === null));
  }
});

test("canonical explicit ownership validates references and old layouts default to unknown", () => {
  const [base] = parseKeyboardLayouts('[["A"]]');
  const known = normalizeKeyboardLayout({ ...base, groups: [{ id: "left", name: "Left" }], keys: [{ ...base.keys[0], groupId: "left" }] });
  assert.equal(known.keys[0].groupId, "left");
  assert.throws(() => normalizeKeyboardLayout({ ...base, keys: [{ ...base.keys[0], groupId: "missing" }] }), /存在/);
  assert.throws(() => normalizeKeyboardLayout({ ...known, groups: [known.groups[0], known.groups[0]] }), /重複/);
  const { groups, ...old } = base;
  delete old.keys[0].groupId;
  assert.equal(normalizeKeyboardLayout(old).keys[0].groupId, null);
});
