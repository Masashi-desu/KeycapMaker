import { test, expect, readDownloadedJson } from "./fixtures.js";

test("UIで編集した寸法と名前をJSONへ書き出す", async ({ editor }) => {
  await editor.open();
  await editor.rename("Wide Escape");
  await editor.setWidth(27);
  await editor.project.open();
  const dialog = await editor.project.openExport("Wide Escape");
  const download = await dialog.exportJson();
  const payload = await readDownloadedJson(download);

  expect(download.suggestedFilename()).toBe("Wide Escape.json");
  expect(payload.params).toMatchObject({ name: "Wide Escape", keyWidth: 27, shapeProfile: "custom-shell" });
  await expect(dialog.root).toBeHidden();
});

test("プロジェクト内のキーを切り替えても各キーの編集値を保持する", async ({ editor }) => {
  await editor.open();
  await editor.rename("Escape");
  await editor.setWidth(18);
  await editor.project.open();
  await editor.project.addCurrent();
  await editor.showDesign();
  await editor.rename("Space");
  await editor.setWidth(36);
  await editor.project.open();
  await expect(editor.project.cards).toHaveCount(2);
  await editor.project.select("Escape");
  await editor.showDesign();
  await expect(editor.name).toHaveValue("Escape");
  await expect(editor.width).toHaveValue("18");
  await editor.project.open();
  await editor.project.select("Space");
  await editor.showDesign();
  await expect(editor.name).toHaveValue("Space");
  await expect(editor.width).toHaveValue("36");
});

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
  expect(state.data.params).toEqual(updated.data.params);

  await editor.setWidth(30);
  const afterUiEdit = await webMcp.execute("get_state");
  expect(afterUiEdit.data.params.keyWidth).toBe(30);
  const preview = await webMcp.execute("preview");
  expect(preview.ok).toBe(true);
  expect(preview.data.preview.status).toBe("success");
  expect(preview.data.preview.parts.length).toBeGreaterThan(0);
  expect(preview.data.preview.parts.every((part) => part.vertices > 0 && part.faces > 0)).toBe(true);
  await editor.project.open();
  await expect(editor.project.activeCard).toContainText("Agent Escape");
});
