import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { createKeyboard3mfExport } from "../src/lib/keyboard-export.js";
import { createGrouped3mfBlob } from "../src/lib/export-3mf.js";
import { normalizeKeyboardLayout, KEYBOARD_LAYOUT_KIND } from "../src/lib/keyboard-layout.js";

const mesh = (name = "body", colorHex = "#ffffff") => ({ name, colorHex,
  vertices: [{ x: 0, y: 0, z: -2 }, { x: 1, y: 0, z: -2 }, { x: 0, y: 1, z: -2 }, { x: 0, y: 0, z: -1 }],
  faces: [[0, 2, 1], [0, 1, 3], [1, 2, 3], [2, 0, 3]] });
const read = async (blob) => Object.fromEntries(Object.entries(unzipSync(new Uint8Array(await blob.arrayBuffer()))).map(([path, bytes]) => [path, strFromU8(bytes)]));
function project() {
  const keyboard = normalizeKeyboardLayout({ kind: KEYBOARD_LAYOUT_KIND, schemaVersion: 1, pitchMm: 20,
    groups: [{ id: "left", name: "Left & group" }, { id: "right", name: "Right" }],
    keys: [{ id: "a", x: 0, y: 0, groupId: "left" }, { id: "b", x: 1, y: 0, groupId: "left" },
      { id: "c", x: 4, y: 0, groupId: "right", r: 90, rx: 4, ry: 0 }, { id: "d", x: 8, y: 2 }, { id: "unused", x: 10, y: 0 }],
  });
  return { keyboard, keycaps: [{ id: "cap", name: "A", params: { name: "A" } }],
    placements: ["a", "b", "c", "d"].map((slotId) => ({ slotId, keycapId: "cap", offsetX: 2, offsetY: 3, z: 4, rotation: 0 })) };
}

test("layout 3MF emits movable structural groups and separate unknown objects with colors and part metadata", async () => {
  const source = project(), body = mesh(), legend = mesh("legend", "#000000");
  source.placements[1].z = 7;
  const exportSignature = JSON.stringify(source);
  let generated = 0;
  const result = await createKeyboard3mfExport(source, { createMeshes: async () => { generated++; return [body, legend]; } });
  assert.equal(generated, 1, "repeated design generated only once");
  assert.deepEqual([result.keyCount, result.groupCount, result.unknownCount, result.objectCount, result.partCount], [4, 2, 1, 3, 8]);
  assert.equal(JSON.stringify(source), exportSignature);
  assert.equal(body.vertices[0].z, -2, "cached local meshes stay unchanged");
  const archive = await read(result.blob), xml = archive["3D/3dmodel.model"];
  assert.equal([...xml.matchAll(/<item objectid=/g)].length, 3);
  assert.equal([...xml.matchAll(/<mesh>/g)].length, 8);
  assert.match(xml, /name="Left &amp; group"/);
  assert.match(xml, /#FFFFFF/);
  assert.match(xml, /#000000/);
  assert.doesNotMatch(xml, /keyboard-surface|keyboard-slot|keyboard-outline/);
  assert.match(archive["Metadata/model_settings.config"], /key="name" value="Left &amp; group"/);
  assert.match(archive["Metadata/model_settings.config"], /1 · A · body/);
  assert.match(archive["Metadata/Slic3r_PE_model.config"], /firstid="4" lastid="7"/);
  // All parts share the source transform; distance between the first two keys is 20 mm.
  const bodies = [...xml.matchAll(/<object[^>]*partnumber="[^">]*body"[^>]*><mesh><vertices>(.*?)<\/vertices>/g)];
  const points = bodies.map((match) => [...match[1].matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map((v) => v.slice(1).map(Number)));
  assert.equal(points[1][0][0] - points[0][0][0], 20);
  assert.equal(points[1][0][2] - points[0][0][2], 3, "relative heights are not flattened");
  assert.equal(points[2][1][0] - points[2][0][0], 0);
  assert.equal(points[2][1][1] - points[2][0][1], -1);
  assert.ok(points.flat().every((p) => p.every(Number.isFinite) && p[2] >= 0));
});

test("each unknown slot stays individually movable even when every slot is unknown", async () => {
  const source = project(); source.keyboard.groups = []; source.keyboard.keys.forEach((key) => { key.groupId = null; });
  const result = await createKeyboard3mfExport(source, { createMeshes: async () => [mesh()] });
  assert.deepEqual([result.objectCount, result.groupCount, result.unknownCount], [4, 0, 4]);
});

test("empty assignments, missing references, failed generation and cancellation never produce a completed export", async () => {
  const createMeshes = async () => [mesh()];
  await assert.rejects(createKeyboard3mfExport({ ...project(), placements: [] }, { createMeshes }), /配置済み/);
  const invalid = project(); invalid.placements[0].keycapId = "missing";
  await assert.rejects(createKeyboard3mfExport(invalid, { createMeshes }), /存在/);
  await assert.rejects(createKeyboard3mfExport(project(), { createMeshes: async () => { throw new Error("WASM failed"); } }), /WASM failed/);
  const controller = new AbortController();
  await assert.rejects(createKeyboard3mfExport(project(), { signal: controller.signal, createMeshes: async () => { controller.abort(); return [mesh()]; } }), { name: "AbortError" });
});

test("grouped 3MF IDs remain unique with more than 1000 part resources", async () => {
  const archive = await read(createGrouped3mfBlob([{ name: "Many", meshes: Array.from({ length: 1001 }, () => mesh()) }]));
  const ids = [...archive["3D/3dmodel.model"].matchAll(/(?:object|m:colorgroup) id="(\d+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
});
