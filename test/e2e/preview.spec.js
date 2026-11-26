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
  await editor.preview.waitForStatus("ready");
  const keyboardImage = await editor.preview.readModelImage();
  await editor.focusWallThickness();
  expect(await editor.preview.readModelImage()).toBe(keyboardImage);
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

test("単体の生成が遅れても全体プレビューを完了し、配置ファイルの読み込みエラーを保つ", async ({ editor, webMcp, frameClock, releaseScad }) => {
  await editor.open();
  const { files } = createSplitKeyboardFixture();
  await editor.keyboard.importFiles(files, "config/info.json");
  await editor.preview.waitForStatus("ready");
  const before = (await webMcp.execute("get_state")).data.project;
  const message = await editor.keyboard.importInvalidFile();
  expect(message).not.toBe("");
  await frameClock.pause();
  expect((await webMcp.execute("get_state")).data.preview.geometry.status).toBe("running");
  const pending = webMcp.execute("preview", { mode: "keyboard" });
  await editor.preview.waitForStatus("running");
  releaseScad();
  await expect.poll(async () => (await webMcp.execute("get_state")).data.preview.geometry.status, { timeout: 30_000 }).toBe("success");
  await frameClock.advance(32);
  expect(await pending).toMatchObject({ ok: true });
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

test("編集項目の初回だけ対象の面を向き、連続編集と再生成では手動の視点を保つ", async ({ editor, webMcp, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await editor.open();
  await editor.focusWidth();
  await editor.preview.waitForStatus("ready");
  const initial = await editor.preview.readModelImage();
  await editor.preview.zoomIn();
  await expect.poll(() => editor.preview.readModelImage()).not.toBe(initial);
  const top = await editor.preview.readModelImage();
  await editor.focusWidthUnits();
  expect(await editor.preview.readModelImage()).toBe(top);

  await editor.preview.orbit();
  await expect.poll(() => editor.preview.readModelImage()).not.toBe(top);
  await editor.focusWidthUnits();
  await editor.setWidth(19);
  const request = await editor.preview.requestId();
  await editor.setWidth(18);
  await editor.preview.waitForNextReady(request);
  const manuallyOriented = await editor.preview.readModelImage();
  expect(manuallyOriented).not.toBe(top);
  expect(manuallyOriented).not.toBe(initial);

  await editor.focusWallThickness();
  const underside = await editor.preview.readModelImage();
  expect(underside).not.toBe(top);

  // The wheel edits an unfocused slider. Returning the width to its initial
  // value lets us compare the same geometry after both scene replacements.
  const beforeWheel = await editor.preview.requestId();
  await editor.stepWidthWithWheel(60);
  await editor.preview.waitForNextReady(beforeWheel);
  const afterWheel = await editor.preview.requestId();
  await editor.stepWidthWithWheel(-60);
  await editor.preview.waitForNextReady(afterWheel);
  expect(await editor.preview.readModelImage()).toBe(initial);

  await editor.openLegends();
  await editor.selectLegendPosition("前面サイドウォール");
  const front = await editor.preview.readModelImage();
  expect(front).not.toBe(initial);
  await editor.selectLegendPosition("背面サイドウォール");
  expect(await editor.preview.readModelImage()).not.toBe(front);
  await editor.selectLegendPosition("前面サイドウォール");
  expect(await editor.preview.readModelImage()).toBe(front);

  const beforeUpdate = await editor.preview.requestId();
  expect((await webMcp.execute("update", { params: { keyWidth: 18 } })).ok).toBe(true);
  await editor.preview.waitForNextReady(beforeUpdate);
  expect(await editor.preview.readModelImage()).toBe(front);

  const fields = await webMcp.execute("get_catalog", {
    section: "fields", keys: ["stemType", "legendText", "sideLegendFrontText", "sideLegendBackText", "sideLegendLeftText", "sideLegendRightText",
      "keyWidth", "topCornerRadiusLeftTop", "topCornerRadiusRightBottom", "dishDepth", "wallThickness", "topPitchDeg"],
  });
  expect(Object.fromEntries(fields.data.map(({ key, previewView, previewZoom }) => [key, [previewView, previewZoom]]))).toEqual({
    stemType: ["underside", 1.28], legendText: ["top", 1.15],
    sideLegendFrontText: ["front", 1.15], sideLegendBackText: ["back", 1.15],
    sideLegendLeftText: ["left", 1.15], sideLegendRightText: ["right", 1.15],
    keyWidth: ["top", 0.84], topCornerRadiusLeftTop: ["top-back-left", 1.12],
    topCornerRadiusRightBottom: ["top-front-right", 1.12], dishDepth: ["top-oblique", 1.12],
    wallThickness: ["underside-oblique", 1.18], topPitchDeg: ["right", null],
  });
});

test("別のキーを選ぶと、そのキーを撮影した角度と倍率を復元する", async ({ editor, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await editor.open();
  await editor.preview.waitForStatus("ready");
  const firstName = await editor.name.inputValue();
  await editor.focusWallThickness();
  const underside = await editor.preview.readModelImage();
  await editor.project.open();
  await editor.project.recaptureActivePreview();

  await editor.showDesign();
  await editor.focusWidth();
  const top = await editor.preview.readModelImage();
  expect(top).not.toBe(underside);
  await editor.project.open();
  await editor.project.addCurrent();
  await editor.showDesign();
  await editor.rename("Second");
  await editor.project.open();

  for (const [name, image] of [[firstName, underside], ["Second", top]]) {
    const previousRequest = await editor.preview.requestId();
    await editor.project.select(name);
    await editor.preview.waitForNextReady(previousRequest);
    expect(await editor.preview.readModelImage()).toBe(image);
  }
});

test("現在のフレームから対象の面へ滑らかに回り、途中のフォーカス変更と手動操作を受け付ける", async ({ editor, frameClock, webMcp }) => {
  await editor.open();
  await editor.preview.waitForStatus("ready");
  await frameClock.pause();
  const initial = await editor.preview.readModelImage();

  await editor.focusWidth();
  expect(await editor.preview.readModelImage()).toBe(initial);
  await frameClock.advance(128);
  const firstStep = await editor.preview.readModelImage();
  expect(firstStep).not.toBe(initial);
  await frameClock.advance(128);
  const nextStep = await editor.preview.readModelImage();
  expect(nextStep).not.toBe(firstStep);

  await editor.focusWallThickness();
  expect(await editor.preview.readModelImage()).toBe(nextStep);
  await frameClock.advance(160);
  const midway = await editor.preview.readModelImage();
  expect(midway).not.toBe(nextStep);
  await editor.preview.holdOrbit();
  await frameClock.advance(640);
  expect(await editor.preview.readModelImage()).toBe(midway);
  await editor.preview.releaseOrbit();

  await editor.focusWidth();
  await frameClock.advance(80);
  const beforeRebuild = await editor.preview.readModelImage();
  const replacement = editor.preview.waitForReplacementCanvas();
  const rebuilt = webMcp.execute("preview", { mode: "keycap" });
  await replacement;
  await frameClock.advance(32);
  expect((await rebuilt).ok).toBe(true);
  await frameClock.advance(640);
  const top = await editor.preview.readModelImage();
  expect(top).not.toBe(beforeRebuild);
  expect(top).not.toBe(midway);
  await editor.focusWallThickness();
  await frameClock.advance(640);
  expect(await editor.preview.readModelImage()).not.toBe(top);
  await editor.focusWidth();
  await frameClock.advance(640);
  expect(await editor.preview.readModelImage()).toBe(top);
});

test("上面のまま横幅では引き、印字では寄り、移動中に戻っても倍率が累積しない", async ({ editor, frameClock }) => {
  await editor.open();
  await editor.openLegends();
  await editor.preview.waitForStatus("ready");
  await frameClock.pause();
  await editor.focusWidth();
  await frameClock.advance(640);
  const footprint = await editor.preview.readModelWidth();

  await editor.focusLegendText();
  await frameClock.advance(224);
  const halfway = await editor.preview.readModelWidth();
  expect(halfway).toBeGreaterThan(footprint);
  await editor.focusWidth();
  await frameClock.advance(640);
  expect(await editor.preview.readModelWidth()).toBe(footprint);

  await editor.focusLegendText();
  await frameClock.advance(640);
  const detail = await editor.preview.readModelWidth();
  expect(detail).toBeGreaterThan(halfway);
  expect(detail).toBeGreaterThan(footprint * 1.25);
  await editor.focusWidth();
  await frameClock.advance(640);
  expect(await editor.preview.readModelWidth()).toBe(footprint);
});
