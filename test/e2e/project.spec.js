import { test, expect } from "./fixtures.js";

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
