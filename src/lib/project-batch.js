import { WebMcpError } from "./webmcp.js";

// Both the single-slot UI command and batch command preserve placement offsets.
export function applyKeyboardAssignments(placements, assignments) {
  const next = new Map(placements.map((entry) => [entry.slotId, { ...entry }]));
  for (const { slotId, keycapId } of assignments) {
    const previous = next.get(slotId);
    next.delete(slotId);
    if (keycapId) next.set(slotId, {
      slotId, keycapId, offsetX: previous?.offsetX ?? 0, offsetY: previous?.offsetY ?? 0,
      z: previous?.z ?? 0, rotation: previous?.rotation ?? 0,
    });
  }
  return [...next.values()];
}

// Build the entire proposal without touching the live project. The caller
// commits once, after validation and its final cancellation check.
export function prepareProjectBatch(project, { keycaps = [], assignments = [] }, createEntry) {
  const refs = new Map();
  const proposed = [];
  for (const input of keycaps) {
    if (refs.has(input.ref)) throw new WebMcpError("invalid_input", `Duplicate keycap ref: ${input.ref}`);
    if (Number(Object.hasOwn(input, "params")) + Number(Object.hasOwn(input, "payload")) !== 1) {
      throw new WebMcpError("invalid_input", `${input.ref}: provide exactly one of params or payload`);
    }
    if (input.baseKeycapId && input.payload) throw new WebMcpError("invalid_input", `${input.ref}: baseKeycapId requires params`);
    const base = input.baseKeycapId ? project.keycaps.find((entry) => entry.id === input.baseKeycapId) : null;
    if (input.baseKeycapId && !base) throw new WebMcpError("not_found", `Unknown baseKeycapId: ${input.baseKeycapId}`);
    const entry = createEntry(input, base, project.keycaps.length + proposed.length);
    refs.set(input.ref, entry.id);
    proposed.push(entry);
  }
  const ids = new Set([...project.keycaps, ...proposed].map((entry) => entry.id));
  const slots = new Set(project.keyboard?.keys.map((key) => key.id) ?? []);
  const seenSlots = new Set();
  const resolved = assignments.map(({ slotId, keycapId, keycapRef }) => {
    if (seenSlots.has(slotId)) throw new WebMcpError("invalid_input", `Duplicate slotId: ${slotId}`);
    seenSlots.add(slotId);
    if (!slots.has(slotId)) throw new WebMcpError("not_found", `Unknown slotId: ${slotId}`);
    if (keycapId && keycapRef) throw new WebMcpError("invalid_input", `${slotId}: provide keycapId or keycapRef, not both`);
    if (keycapRef && !refs.has(keycapRef)) throw new WebMcpError("not_found", `Unknown keycapRef: ${keycapRef}`);
    const id = keycapRef ? refs.get(keycapRef) : keycapId;
    if (id && !ids.has(id)) throw new WebMcpError("not_found", `Unknown keycapId: ${id}`);
    return { slotId, keycapId: id };
  });
  return {
    keycaps: [...project.keycaps, ...proposed],
    placements: applyKeyboardAssignments(project.placements, resolved),
    created: [...refs].map(([ref, keycapId]) => ({ ref, keycapId })),
    assignedCount: resolved.filter((entry) => entry.keycapId).length,
    clearedCount: resolved.filter((entry) => !entry.keycapId).length,
  };
}
