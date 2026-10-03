import { createGrouped3mfBlob } from "./export-3mf.js";
import { placeKeyboardMesh } from "./keyboard-preview.js";

export async function createKeyboard3mfExport(project, { createMeshes, signal, groupName = (group) => group.name, unknownName = "Unknown" }) {
  const board = project.keyboard;
  if (!board || !project.placements.length) throw new Error("印刷する配置済みキーキャップがありません。");
  const caps = new Map(project.keycaps.map((entry) => [entry.id, entry]));
  const slots = new Map(board.keys.map((key) => [key.id, key]));
  const definitions = new Map(board.groups.map((group) => [group.id, group]));
  const groups = new Map(), cache = new Map();
  let unknownCount = 0;
  for (const placement of project.placements) {
    signal?.throwIfAborted();
    const key = slots.get(placement.slotId), entry = caps.get(placement.keycapId);
    if (!key || !entry) throw new Error("配置先またはキーキャップが存在しません。");
    const signature = JSON.stringify(entry.params);
    if (!cache.has(signature)) cache.set(signature, await createMeshes(entry.params, { signal }));
    signal?.throwIfAborted();
    const meshes = cache.get(signature);
    if (!meshes.length || meshes.some((mesh) => !mesh.vertices.length || !mesh.faces.length)) throw new Error("キーキャップのメッシュがありません。");
    const definition = definitions.get(key.groupId);
    // Unknown keys have individual objects; unknown is not a physical group.
    const id = definition ? `group:${definition.id}` : `slot:${key.id}`;
    if (!definition) unknownCount++;
    if (!groups.has(id)) groups.set(id, { name: definition ? groupName(definition) : `${unknownName} · ${key.label} · ${entry.name}`, meshes: [] });
    for (const mesh of meshes) groups.get(id).meshes.push({
      name: `${key.label} · ${entry.name} · ${mesh.name.replace(/^keycap[-_]/i, "")}`, colorHex: mesh.colorHex,
      ...placeKeyboardMesh(mesh, key, board.pitchMm, placement),
    });
  }
  // One shared translation preserves all inter-key distances, angles and heights.
  const minimum = { x: Infinity, y: Infinity, z: Infinity };
  for (const group of groups.values()) for (const mesh of group.meshes) for (const v of mesh.vertices) {
    for (const axis of ["x", "y", "z"]) {
      if (!Number.isFinite(v[axis])) throw new Error("出力メッシュの座標が不正です。");
      minimum[axis] = Math.min(minimum[axis], v[axis]);
    }
  }
  for (const group of groups.values()) for (const mesh of group.meshes) for (const v of mesh.vertices)
    for (const axis of ["x", "y", "z"]) v[axis] -= minimum[axis];
  signal?.throwIfAborted();
  return { blob: createGrouped3mfBlob([...groups.values()]), keyCount: project.placements.length,
    groupCount: groups.size - unknownCount, unknownCount, objectCount: groups.size,
    partCount: [...groups.values()].reduce((sum, group) => sum + group.meshes.length, 0) };
}
