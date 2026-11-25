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
