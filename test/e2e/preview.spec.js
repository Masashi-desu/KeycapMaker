import { test, expect } from "./fixtures.js";
import { createSplitKeyboardFixture } from "../support/keyboard-group-fixture.js";

test("設計と配置への移動でプレビューを切り替え、その後の手動選択をUIとWebMCPで維持する", async ({ editor, webMcp }) => {
  await editor.open();
  await editor.keyboard.open();
  const noBoard = await webMcp.execute("get_state");
  expect(noBoard.data.previewMode).toBe("keycap");

  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  await expect(editor.preview.keyboardButton).toHaveAttribute("aria-pressed", "true");
  await editor.showDesign();
  await expect(editor.preview.keycapButton).toHaveAttribute("aria-pressed", "true");
  await editor.preview.showKeyboard();
  await editor.setWidth(18);
  await editor.showDesign();
  await expect(editor.preview.keyboardButton).toHaveAttribute("aria-pressed", "true");

  await editor.keyboard.open();
  await editor.preview.showKeycap();
  await editor.keyboard.selectSlot("key-1");
  await editor.keyboard.open();
  await expect(editor.preview.keycapButton).toHaveAttribute("aria-pressed", "true");
  await editor.project.open();
  await expect(editor.preview.keycapButton).toHaveAttribute("aria-pressed", "true");
  await editor.project.openKeyboardConfiguration();
  await expect(editor.preview.keyboardButton).toHaveAttribute("aria-pressed", "true");

  const design = await webMcp.execute("set_view", { tab: "design" });
  expect(design.data).toMatchObject({ tab: "design", previewMode: "keycap" });
  await expect(editor.designTab).toHaveAttribute("aria-pressed", "true");
  await expect(editor.preview.keycapButton).toHaveAttribute("aria-pressed", "true");
  await webMcp.execute("set_view", { previewMode: "keyboard" });
  const sameTab = await webMcp.execute("set_view", { tab: "design" });
  expect(sameTab.data.previewMode).toBe("keyboard");
  await webMcp.execute("set_view", { previewMode: "keycap" });
  const keyboard = await webMcp.execute("set_view", { tab: "keyboard" });
  expect(keyboard.data).toMatchObject({ tab: "keyboard", previewMode: "keyboard" });
  await expect(editor.preview.keyboardButton).toHaveAttribute("aria-pressed", "true");
  const explicit = await webMcp.execute("set_view", { tab: "design", previewMode: "keyboard" });
  expect(explicit.data).toMatchObject({ tab: "design", previewMode: "keyboard" });
  await expect(editor.preview.keyboardButton).toHaveAttribute("aria-pressed", "true");
  await editor.keyboard.open();
  await editor.keyboard.assignCurrent("key-1");
  await editor.keyboard.editAssigned();
  await expect(editor.designTab).toHaveAttribute("aria-pressed", "true");
  await expect(editor.preview.keycapButton).toHaveAttribute("aria-pressed", "true");
});

test("モデルを生成できない割り当てがあると全体の表示完了を成功にしない", async ({ editor, webMcp, scadUnavailable }) => {
  expect(scadUnavailable).toBe(true);
  await editor.open();
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  const state = (await webMcp.execute("get_state")).data;
  await webMcp.execute("batch", { assignments: [{ slotId: "key-0", keycapId: state.project.activeKeycapId }] });
  const preview = await webMcp.execute("preview", { mode: "keyboard" });
  expect(preview).toMatchObject({ ok: false, error: { code: "preview_failed" } });
  const display = (await webMcp.execute("get_state")).data.preview.display;
  expect(display).toMatchObject({ status: "error", mode: "keyboard", assignedCount: 1, renderedAssignedCount: 0, modelCount: 0 });
  expect(display.errors).toHaveLength(1);
  expect(display.errors[0].keycapId).toBe(state.project.activeKeycapId);
  await expect(editor.keyboard.previewStatus).toBeVisible();
  await webMcp.execute("batch", { assignments: [{ slotId: "key-0" }] });
  expect((await webMcp.execute("preview", { mode: "keyboard" })).ok).toBe(true);
  await expect(editor.keyboard.previewStatus).toBeHidden();
});

test("全体プレビューの成功で配置ファイルの読み込みエラーを消さない", async ({ editor, webMcp }) => {
  await editor.open();
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  const before = (await webMcp.execute("get_state")).data.project;
  const message = await editor.keyboard.importInvalidFile();
  expect(message).not.toBe("");
  expect((await webMcp.execute("preview", { mode: "keyboard" })).ok).toBe(true);
  await expect(editor.keyboard.importStatus).toHaveText(message);
  await expect(editor.keyboard.importStatus).toHaveClass(/is-error/);
  await expect(editor.keyboard.previewStatus).toBeHidden();
  expect((await webMcp.execute("get_state")).data.project).toEqual(before);
});

test("全体プレビューの生成途中にUIで表示を切り替えると完了扱いしない", async ({ editor, webMcp }) => {
  await editor.open();
  await webMcp.execute("preview", { mode: "keycap" });
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  await editor.preview.showKeycap();
  await webMcp.execute("batch", { keycaps: [{ ref: "fresh", params: { name: "Fresh", legendEnabled: true, legendText: "Wait", homingBarEnabled: true } }],
    assignments: [{ slotId: "key-0", keycapRef: "fresh" }] });
  const pending = webMcp.execute("preview", { mode: "keyboard" });
  await editor.preview.waitForStatus("running");
  expect((await webMcp.execute("get_state")).data.preview.display.status).toBe("running");
  await editor.preview.showKeycap();
  expect(await pending).toMatchObject({ ok: false, error: { code: "preview_superseded" } });
  expect((await webMcp.execute("preview", { mode: "keycap" })).ok).toBe(true);
});
