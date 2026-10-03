import test from "node:test";
import assert from "node:assert/strict";
import { applyKeyboardAssignments, prepareProjectBatch } from "../src/lib/project-batch.js";

const project = () => ({ keycaps: [{ id: "existing", params: { name: "Base", keyWidth: 18 } }],
  keyboard: { keys: [{ id: "left" }, { id: "right" }, { id: "thumb" }] },
  placements: [{ slotId: "left", keycapId: "existing", offsetX: 1.2, offsetY: -2, z: 3, rotation: 10 }] });
const createEntry = (input, base, displayOrder) => ({ id: `new-${input.ref}`, displayOrder, params: { ...base?.params, ...input.params } });

test("batch stages copies and shared refs with preserved corrections without mutating its source", () => {
  const source = project(); const before = structuredClone(source);
  const plan = prepareProjectBatch(source, {
    keycaps: [{ ref: "letter", baseKeycapId: "existing", params: { name: "A" } }],
    assignments: [{ slotId: "left", keycapRef: "letter" }, { slotId: "right", keycapRef: "letter" }, { slotId: "thumb", keycapId: "existing" }],
  }, createEntry);
  assert.deepEqual(source, before);
  assert.deepEqual(plan.created, [{ ref: "letter", keycapId: "new-letter" }]);
  assert.equal(plan.keycaps[1].params.keyWidth, 18);
  assert.deepEqual(plan.placements[0], { ...before.placements[0], keycapId: "new-letter" });
  assert.equal(plan.placements[1].keycapId, "new-letter");
  assert.equal(plan.assignedCount, 3);
  assert.equal(plan.clearedCount, 0);
});

test("late invalid input, ambiguous sources and duplicate refs or slots leave the entire project unchanged", () => {
  const source = project(); const before = structuredClone(source);
  const valid = { ref: "a", params: { name: "A" } };
  const invalid = [
    { keycaps: [valid], assignments: [{ slotId: "left", keycapRef: "a" }, { slotId: "missing", keycapRef: "a" }] },
    { keycaps: [valid, valid] },
    { assignments: [{ slotId: "left" }, { slotId: "left", keycapId: "existing" }] },
    { assignments: [{ slotId: "right", keycapRef: "unknown" }] },
    { assignments: [{ slotId: "right", keycapId: "unknown" }] },
    { keycaps: [{ ...valid, baseKeycapId: "unknown" }] },
    { keycaps: [{ ref: "a" }] }, { keycaps: [{ ...valid, payload: {} }] },
    { keycaps: [{ ref: "a", payload: {}, baseKeycapId: "existing" }] },
    { keycaps: [valid], assignments: [{ slotId: "right", keycapRef: "a", keycapId: "existing" }] },
  ];
  for (const input of invalid) {
    assert.throws(() => prepareProjectBatch(source, input, createEntry), (error) => ["invalid_input", "not_found"].includes(error.code));
    assert.deepEqual(source, before);
  }
  assert.throws(() => prepareProjectBatch(source, { keycaps: [valid, { ref: "b", params: {} }] }, (input, ...args) => {
    if (input.ref === "b") throw new Error("invalid dimensions");
    return createEntry(input, ...args);
  }), /invalid dimensions/);
  assert.deepEqual(source, before);
});

test("assignment-only batches can clear slots and the UI helper retains corrections", () => {
  const source = project();
  const plan = prepareProjectBatch(source, { assignments: [{ slotId: "left" }, { slotId: "right", keycapId: "existing" }] }, createEntry);
  assert.equal(plan.assignedCount, 1); assert.equal(plan.clearedCount, 1);
  assert.deepEqual(plan.created, []); assert.deepEqual(plan.keycaps, source.keycaps);
  assert.deepEqual(plan.placements, [{ slotId: "right", keycapId: "existing", offsetX: 0, offsetY: 0, z: 0, rotation: 0 }]);
  assert.deepEqual(applyKeyboardAssignments(source.placements, [{ slotId: "left", keycapId: "new" }])[0], { ...source.placements[0], keycapId: "new" });
});
