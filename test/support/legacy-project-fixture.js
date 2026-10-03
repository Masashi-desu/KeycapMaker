import { strToU8 } from "fflate";
import { normalizeKeyboardLayout } from "../../src/lib/keyboard-layout.js";

export function createLegacyProjectFixture() {
  const keycaps = [18, 27].map((keyWidth, index) => {
    const entry = {
      id: `keycap-legacy-${index}`, name: "Esc", displayOrder: index,
      jsonPath: `keycaps/Esc-${index}.json`, previewPath: `keycaps/Esc-${index}.svg`,
      threeMfPath: `3mf/Esc-${index}.3mf`,
      previewViewState: { direction: [1, 1, 1], distanceScale: 2, targetScale: [0, 0, 0], viewOffsetRatio: [0.1, -0.1] },
      editorDataPayload: { kind: "keycap-maker/editor-params", schemaVersion: 5,
        params: { shapeProfile: "custom-shell", name: "Esc", keyWidth, legendEnabled: false,
          homingBarEnabled: false, bodyColor: index ? "#bf5044" : "#245a81", legacyUnknown: index + 42 } },
    };
    return entry;
  });
  const keyboard = normalizeKeyboardLayout({ kind: "keycap-maker/keyboard", schemaVersion: 1,
    name: "Fixture", groups: [{ id: "left", side: "left", name: "Left" }, { id: "right", side: "right", name: "Right" }],
    keys: [{ id: "l", label: "L", x: 0, y: 0, groupId: "left" },
      { id: "r", label: "R", x: 5, y: 0, groupId: "right" }, { id: "u", label: "U", x: 7, y: 0, groupId: null }] });
  const placements = [
    { slotId: "l", keycapId: keycaps[0].id, offsetX: 1.2, offsetY: -0.5, z: 0.2, rotation: 15 },
    { slotId: "r", keycapId: keycaps[1].id, offsetX: 0, offsetY: 0, z: 0, rotation: 0 },
    { slotId: "u", keycapId: keycaps[1].id, offsetX: 0, offsetY: 0, z: 0, rotation: 0 },
  ];
  const manifest = { kind: "keycap-maker/project", schemaVersion: 1, name: "Legacy Project",
    keycaps: keycaps.map(({ editorDataPayload, ...entry }) => entry), keyboard, placements, activeKeycapId: keycaps[1].id };
  const files = { "KeycapMaker.json": strToU8(JSON.stringify(manifest)) };
  for (const entry of keycaps) {
    files[entry.jsonPath] = strToU8(JSON.stringify(entry.editorDataPayload));
    files[entry.previewPath] = strToU8('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#245a81"/></svg>');
  }
  return { files, manifest, keycaps };
}
