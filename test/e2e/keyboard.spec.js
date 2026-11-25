import { test, expect, readDownloaded3mf } from "./fixtures.js";
import { createSplitKeyboardFixture } from "../support/keyboard-group-fixture.js";
import { contrastRatio } from "./support/color-contrast.js";

test("構造から分割所属を表示し、配置したキーだけをグループ付き3MFに出力する", async ({ editor, webMcp }, testInfo) => {
  await editor.open();
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  await expect(editor.keyboard.dangerZone).not.toHaveAttribute("open");
  await expect(editor.keyboard.removeButton).toBeHidden();
  await expect(editor.keyboard.inspectorPreviewButton).toHaveCount(0);
  await expect(editor.preview.keyboardButton).toHaveCount(1);
  await expect(editor.keyboard.assignCurrentButton).toBeVisible();
  await expect(editor.keyboard.offsetInputs).toHaveCount(0);
  await expect(editor.keyboard.editAssignedButton).toHaveCount(0);
  await expect(editor.keyboard.exportIcon).toHaveCount(1);
  await expect(editor.keyboard.group).toHaveText("分割所属: 左側");
  await expect(editor.keyboard.exportButton).toBeDisabled();
  const initial = await webMcp.execute("get_state");
  expect(initial.data.project.keyboard.groups).toHaveLength(2);
  expect(initial.data.project.keyboard.keys[2].groupId).toBeNull();

  await editor.keyboard.assignCurrent("key-0");
  await expect(editor.keyboard.offsetInputs).toHaveCount(4);
  await expect(editor.keyboard.editAssignedButton).toBeVisible();
  await editor.keyboard.setOffset("offsetX", 1.2);
  const corrected = await webMcp.execute("get_state");
  expect(corrected.data.project.placements[0]).toMatchObject({ slotId: "key-0", offsetX: 1.2 });
  expect(corrected.data.observedParams).toEqual(initial.data.observedParams);
  await editor.keyboard.selectSlot("key-1");
  await expect(editor.keyboard.group).toHaveText("分割所属: 右側");
  await editor.keyboard.assignCurrent("key-1");
  await expect(editor.keyboard.offsetInput("offsetX")).toHaveValue("0");
  await editor.keyboard.assignCurrent("key-3");
  await editor.keyboard.selectSlot("key-2");
  await expect(editor.keyboard.group).toHaveText("分割所属: 不明");
  await editor.preview.showKeyboard();
  const uiDownload = await editor.keyboard.export3mf();
  await expect(editor.keyboard.exportStatus).toHaveText("3 個の配置済みキーを書き出しました。");
  const uiArchive = await readDownloaded3mf(uiDownload);
  expect(uiDownload.suggestedFilename()).toBe("Keycap Project-keyboard.3mf");
  expect([...uiArchive["3D/3dmodel.model"].matchAll(/<item objectid=/g)]).toHaveLength(2);
  expect(uiArchive["Metadata/model_settings.config"]).toContain('value="左側"');
  expect(uiArchive["Metadata/model_settings.config"]).toContain('value="右側"');
  expect([...uiArchive["Metadata/model_settings.config"].matchAll(/<part id=/g)]).toHaveLength(9);
  expect(uiArchive["3D/3dmodel.model"]).not.toContain("keyboard-surface");
  expect(uiArchive["3D/3dmodel.model"]).not.toContain("3 · keycap-preview");
  await uiDownload.saveAs(testInfo.outputPath("browser-keyboard.3mf"));

  const agentExport = await webMcp.executeWithDownload("export", { format: "keyboard-3mf" });
  expect(agentExport.result.ok).toBe(true);
  expect(agentExport.result.data).toMatchObject({ keyCount: 3, groupCount: 2, unknownCount: 0 });
  const agentArchive = await readDownloaded3mf(agentExport.download);
  expect(agentArchive["3D/3dmodel.model"]).toBe(uiArchive["3D/3dmodel.model"]);
});

test("危険ゾーンからの配置削除は確認が必要で、キーキャップのデザインを保持する", async ({ editor, webMcp }) => {
  await editor.open();
  await editor.rename("削除後も残るデザイン");
  await editor.setWidth(18);
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  await editor.keyboard.assignCurrent("key-0");
  await expect(editor.keyboard.dangerZone).toBeVisible();
  await expect(editor.keyboard.removeButton).toBeHidden();
  await editor.keyboard.expandDangerZone();
  await editor.keyboard.selectSlot("key-1");
  await expect(editor.keyboard.removeButton).toBeVisible();
  const before = await webMcp.execute("get_state");

  let lightColors;
  for (const theme of ["light", "dark"]) {
    await editor.setTheme(theme);
    const samples = await editor.keyboard.readDangerColors();
    expect(samples).toHaveLength(3);
    for (const sample of samples) {
      expect(contrastRatio(sample.color, sample.background), `${theme}: ${sample.label}`).toBeGreaterThanOrEqual(4.5);
    }
    if (theme === "light") lightColors = samples;
    else expect(samples).not.toEqual(lightColors);
    await editor.keyboard.hoverRemove();
    for (const sample of await editor.keyboard.readDangerColors()) {
      expect(contrastRatio(sample.color, sample.background), `${theme}, hover: ${sample.label}`).toBeGreaterThanOrEqual(4.5);
    }
  }

  const cancelled = await editor.keyboard.removeLayout({ confirm: false });
  expect(cancelled.type).toBe("confirm");
  expect(cancelled.message).toContain(before.data.project.keyboard.name);
  expect(cancelled.message).toContain("1 箇所の割り当て");
  const afterCancel = await webMcp.execute("get_state");
  expect(afterCancel.data.project.keyboard).toEqual(before.data.project.keyboard);
  expect(afterCancel.data.project.placements).toEqual(before.data.project.placements);
  expect(afterCancel.data.observedParams).toEqual(before.data.observedParams);
  await expect(editor.keyboard.removeButton).toBeVisible();

  const confirmed = await editor.keyboard.removeLayout({ confirm: true });
  expect(confirmed).toEqual(cancelled);
  await expect(editor.keyboard.slot).toHaveCount(0);
  await expect(editor.keyboard.dangerZone).toHaveCount(0);
  const afterRemove = await webMcp.execute("get_state");
  expect(afterRemove.data.project.keyboard).toBeNull();
  expect(afterRemove.data.project.placements).toEqual([]);
  expect(afterRemove.data.project.keycaps).toEqual(before.data.project.keycaps);
  expect(afterRemove.data.project.activeKeycapId).toBe(before.data.project.activeKeycapId);
  expect(afterRemove.data.observedParams).toEqual(before.data.observedParams);
  expect(afterRemove.data.previewMode).toBe("keycap");
  await editor.showDesign();
  await expect(editor.name).toHaveValue("削除後も残るデザイン");
  await expect(editor.width).toHaveValue("18");
});

test("配置済みキーがない場合の全体3MF出力はWebMCPでも失敗を返す", async ({ editor, webMcp }) => {
  await editor.open();
  const result = await webMcp.execute("export", { format: "keyboard-3mf" });
  expect(result).toMatchObject({ ok: false, error: { code: "export_failed" } });
});
