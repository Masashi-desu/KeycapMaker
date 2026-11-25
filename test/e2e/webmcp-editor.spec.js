import { test, expect } from "./fixtures.js";

test("WebMCPの更新をUIへ反映し、不正な部分更新は全体を拒否する", async ({ editor, webMcp }) => {
  await editor.open();
  const updated = await webMcp.execute("update", { params: { name: "Agent Escape", keyWidth: 24 } });
  expect(updated.ok).toBe(true);
  await expect(editor.name).toHaveValue("Agent Escape");
  await expect(editor.width).toHaveValue("24");

  // A valid width is staged before the invalid runtime stem ID is rejected.
  const invalid = await webMcp.execute("update", { params: { name: "Should not apply", keyWidth: 29, stemType: "unknown-stem" } });
  expect(invalid).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  await expect(editor.name).toHaveValue("Agent Escape");
  await expect(editor.width).toHaveValue("24");
  const state = await webMcp.execute("get_state");
  expect(state.data.observedParams).toEqual(updated.data.observedParams);

  await editor.setWidth(30);
  const afterUiEdit = await webMcp.execute("get_state");
  expect(afterUiEdit.data.observedParams.keyWidth).toBe(30);
  const preview = await webMcp.execute("preview");
  expect(preview.ok).toBe(true);
  expect(preview.data.preview.geometry.status).toBe("success");
  expect(preview.data.preview.geometry.parts.length).toBeGreaterThan(0);
  expect(preview.data.preview.geometry.parts.every((part) => part.vertices > 0 && part.faces > 0)).toBe(true);
  await editor.project.open();
  await expect(editor.project.activeCard).toContainText("Agent Escape");
});
