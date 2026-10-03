import { test, expect } from "./fixtures.js";
import { createSplitKeyboardFixture } from "../support/keyboard-group-fixture.js";

test("再入力用データと一括作成・割り当てがUIへ同期し、全体の描画完了を取得する", async ({ editor, webMcp }) => {
  await editor.open();
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  await editor.keyboard.assignCurrent("key-0");
  await editor.keyboard.setOffset("offsetX", 1.2);
  await editor.keyboard.showKeycapPreview();
  const before = (await webMcp.execute("get_state")).data;
  expect(before).not.toHaveProperty("params");
  expect(before.observedParams).toHaveProperty("stemEnabled");
  const source = (await webMcp.execute("get_input")).data.keycaps[0];
  expect(source.keycapId).toBe(before.project.activeKeycapId);
  expect(source.updateParams).not.toHaveProperty("stemEnabled");
  expect(source.updateParams).not.toHaveProperty("topVisibleCenterHeight");
  expect(source.updateParams).not.toHaveProperty("rimWidth");
  const replay = await webMcp.execute("update", { params: source.updateParams });
  expect(replay.ok).toBe(true);
  const ready = await webMcp.execute("preview", { mode: "keycap" });
  expect(ready.ok).toBe(true);
  expect(ready.data.preview.display).toMatchObject({ status: "ready", mode: "keycap", rendered: true });

  const batchInput = {
    keycaps: [
      { ref: "a", baseKeycapId: source.keycapId, params: { name: "Alpha A", legendEnabled: true, legendText: "A", bodyColor: "#245a81" } },
      { ref: "shift", params: { shapeProfile: "custom-shell", name: "Shift", legendEnabled: true, legendText: "Shift", keyWidth: 27 } },
      { ref: "copy", payload: source.editorPayload },
    ],
    assignments: [{ slotId: "key-0", keycapRef: "a" }, { slotId: "key-1", keycapRef: "shift" },
      { slotId: "key-2", keycapRef: "shift" }, { slotId: "key-3", keycapRef: "copy" }],
  };
  const invalid = await webMcp.execute("batch", { ...batchInput, assignments: [...batchInput.assignments, { slotId: "missing", keycapRef: "a" }] });
  expect(invalid).toMatchObject({ ok: false, error: { code: "not_found" } });
  expect((await webMcp.execute("get_state")).data.project).toEqual(replay.data.project);
  const invalidPayload = await webMcp.execute("batch", { keycaps: [{ ref: "valid", params: { name: "Valid" } }, { ref: "invalid", payload: {} }] });
  expect(invalidPayload).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  expect((await webMcp.execute("get_state")).data.project).toEqual(replay.data.project);
  const batch = await webMcp.execute("batch", batchInput);
  expect(batch).toMatchObject({ ok: true, contractVersion: 2, data: { assignedCount: 4, clearedCount: 0 } });
  const { created, state } = batch.data;
  expect(created).toHaveLength(3);
  expect(state.project.activeKeycapId).toBe(before.project.activeKeycapId);
  expect(state.project.placements[0].offsetX).toBe(1.2);
  expect(state.project.placements[1].keycapId).toBe(state.project.placements[2].keycapId);
  const inputs = (await webMcp.execute("get_input", { keycapIds: created.map((entry) => entry.keycapId) })).data.keycaps;
  expect(inputs[0].editorPayload.params).toMatchObject({ legendText: "A", bodyColor: "#245a81" });
  expect(inputs[2].editorPayload.params).toEqual(source.editorPayload.params);
  await editor.project.open();
  await expect(editor.project.cards).toHaveCount(4);
  await expect(editor.project.entry("Alpha A")).toBeVisible();
  await editor.keyboard.open();
  await editor.keyboard.selectSlot("key-0");
  await expect(editor.keyboard.assignmentCard).toContainText("Alpha A");

  const preview = await webMcp.execute("preview", { mode: "keyboard" });
  expect(preview.ok, JSON.stringify(preview.error)).toBe(true);
  expect(preview.data.preview.display).toMatchObject({ status: "ready", mode: "keyboard", rendered: true,
    keyCount: 4, assignedCount: 4, renderedAssignedCount: 4, modelCount: 3 });
  expect(preview.data.preview.display.partCount).toBeGreaterThan(4);
  await expect(editor.previewStage).toHaveAttribute("data-preview-status", "ready");
  await expect(editor.previewStage).toHaveAttribute("data-preview-request-id", String(preview.data.preview.display.requestId));
  await expect(editor.previewStage).toHaveAttribute("aria-busy", "false");
  const frame = await editor.readPreviewFrame();
  expect(frame.frame).toBe("1"); expect(frame.width).toBeGreaterThan(0); expect(frame.height).toBeGreaterThan(0);
  const cleared = await webMcp.execute("batch", { assignments: [{ slotId: "key-2" }] });
  expect(cleared.data.clearedCount).toBe(1);
  const updatedPreview = await webMcp.execute("preview", { mode: "keyboard" });
  expect(updatedPreview.ok).toBe(true);
  expect(updatedPreview.data.preview.display).toMatchObject({ assignedCount: 3, renderedAssignedCount: 3 });
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
  await editor.keyboard.showKeycapPreview();
  await webMcp.execute("batch", { keycaps: [{ ref: "fresh", params: { name: "Fresh", legendEnabled: true, legendText: "Wait", homingBarEnabled: true } }],
    assignments: [{ slotId: "key-0", keycapRef: "fresh" }] });
  const pending = webMcp.execute("preview", { mode: "keyboard" });
  await editor.waitPreviewStatus("running");
  expect((await webMcp.execute("get_state")).data.preview.display.status).toBe("running");
  await editor.keyboard.showKeycapPreview();
  expect(await pending).toMatchObject({ ok: false, error: { code: "preview_superseded" } });
  expect((await webMcp.execute("preview", { mode: "keycap" })).ok).toBe(true);
});
