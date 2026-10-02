import { getKeyboardBounds, getKeyboardKeyCenter } from "./keyboard-layout.js";

function boxMesh(width, depth, bottom, top) {
  return {
    vertices: [[-1,-1,bottom],[1,-1,bottom],[1,1,bottom],[-1,1,bottom],[-1,-1,top],[1,-1,top],[1,1,top],[-1,1,top]].map(([x,y,z]) => ({ x: x * width / 2, y: y * depth / 2, z })),
    faces: [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],
  };
}

export function placeKeyboardMesh(mesh, key, pitchMm, placement = {}, mountOrigin = {}) {
  const center = getKeyboardKeyCenter(key, pitchMm);
  const angle = -(key.r + (placement.rotation || 0)) * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return {
    vertices: mesh.vertices.map((v) => {
      const x = v.x - (mountOrigin.x || 0), y = v.y - (mountOrigin.y || 0);
      return { x: center.x + (placement.offsetX || 0) + x * cos - y * sin,
        y: -center.y - (placement.offsetY || 0) + x * sin + y * cos, z: v.z + (placement.z || 0) };
    }),
    faces: mesh.faces,
  };
}

export function createKeyboardPreviewLayers(keyboard, placements = [], meshes = new Map(), selectedSlotId = "") {
  const layers = [];
  const pitch = keyboard.pitchMm;
  const bySlot = new Map(placements.map((entry) => [entry.slotId, entry]));
  for (const key of keyboard.keys) {
    const placement = bySlot.get(key.id);
    const model = placement && meshes.get(placement.keycapId);
    if (model) {
      const center = getKeyboardKeyCenter(key, pitch);
      for (const layer of model.layers) layers.push({ ...layer, slotId: key.id,
        transform: { x: center.x + placement.offsetX, y: -center.y - placement.offsetY, z: placement.z,
          rotation: -(key.r + placement.rotation) * Math.PI / 180 },
      });
    } else {
      layers.push({ name: "keyboard-slot", slotId: key.id,
        color: key.id === selectedSlotId ? 0xb88952 : placement ? 0x88a9bc : 0xbac1c8, opacity: 0.48,
        mesh: placeKeyboardMesh(boxMesh(Math.max(key.w * pitch - 1.2, 1), Math.max(key.h * pitch - 1.2, 1), 0, 2), key, pitch, placement) });
    }
  }
  // A diagrammatic mounting surface; firmware files do not describe PCB/case geometry.
  const bounds = getKeyboardBounds(keyboard);
  const centerX = (bounds.minX + bounds.maxX) * pitch / 2, centerY = -(bounds.minY + bounds.maxY) * pitch / 2;
  if (!keyboard.outline.length) {
    const mesh = boxMesh((bounds.maxX - bounds.minX) * pitch + 6, (bounds.maxY - bounds.minY) * pitch + 6, -2.5, -2);
    mesh.vertices.forEach((v) => { v.x += centerX; v.y += centerY; });
    layers.push({ name: "keyboard-surface", color: 0x566777, opacity: 0.14, mesh });
  }
  for (const [x, y, x2, y2] of keyboard.outline) {
    const dx = (x2 - x) * pitch, dy = -(y2 - y) * pitch, length = Math.hypot(dx, dy);
    if (!length) continue;
    const angle = Math.atan2(dy, dx), cos = Math.cos(angle), sin = Math.sin(angle);
    const mesh = boxMesh(length, 0.5, -2.5, -2);
    mesh.vertices = mesh.vertices.map((v) => ({ x: (x + x2) * pitch / 2 + v.x * cos - v.y * sin,
      y: -(y + y2) * pitch / 2 + v.x * sin + v.y * cos, z: v.z }));
    layers.push({ name: "keyboard-outline", color: 0x566777, mesh });
  }
  return layers;
}
