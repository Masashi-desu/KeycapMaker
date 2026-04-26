import test from "node:test";
import assert from "node:assert/strict";

import { createPreviewGeometry } from "../src/lib/preview-scene.js";

function readNormal(geometry, vertexIndex) {
  const normals = geometry.getAttribute("normal");
  return {
    x: normals.getX(vertexIndex),
    y: normals.getY(vertexIndex),
    z: normals.getZ(vertexIndex),
  };
}

function assertNormalClose(actual, expected, message) {
  assert.ok(Math.abs(actual.x - expected.x) < 1e-6, `${message}: x`);
  assert.ok(Math.abs(actual.y - expected.y) < 1e-6, `${message}: y`);
  assert.ok(Math.abs(actual.z - expected.z) < 1e-6, `${message}: z`);
}

test("preview normals keep top-hat-like creases hard", () => {
  const geometry = createPreviewGeometry({
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 1, z: 1 },
    ],
    faces: [
      [0, 1, 2],
      [0, 1, 3],
    ],
  });

  assertNormalClose(readNormal(geometry, 0), { x: 0, y: 0, z: 1 }, "first face normal at shared edge");
  assertNormalClose(readNormal(geometry, 3), { x: 0, y: -Math.SQRT1_2, z: Math.SQRT1_2 }, "second face normal at shared edge");
});

test("preview normals do not blend faces that only touch at one vertex", () => {
  const shallowTiltY = Math.cos(Math.PI / 9);
  const shallowTiltZ = Math.sin(Math.PI / 9);
  const geometry = createPreviewGeometry({
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: shallowTiltY, z: shallowTiltZ },
    ],
    faces: [
      [0, 1, 2],
      [0, 3, 4],
    ],
  });

  assertNormalClose(readNormal(geometry, 0), { x: 0, y: 0, z: 1 }, "first face normal at vertex-only contact");
});
