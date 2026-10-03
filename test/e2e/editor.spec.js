import { test, expect, readDownloadedJson } from "./fixtures.js";

import { contrastRatio } from "./support/color-contrast.js";

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

test("テーマの切り替えは入力欄の配色を変え、キーキャップの製造色を保持する", async ({ editor, webMcp }) => {
  await editor.open();
  const updated = await webMcp.execute("update", { params: { bodyColor: "#245a81", legendColor: "#f0d48d", homingBarColor: "#bf5044" } });
  expect(updated.ok).toBe(true);
  let lightColors;
  for (const theme of ["light", "dark"]) {
    await editor.setTheme(theme);
    const samples = await editor.readInputColors();
    expect(samples).toHaveLength(2);
    for (const sample of samples) {
      expect(contrastRatio(sample.color, sample.background), `${theme}: input`).toBeGreaterThanOrEqual(4.5);
    }
    if (theme === "light") lightColors = samples;
    else expect(samples).not.toEqual(lightColors);
    const state = await webMcp.execute("get_state");
    expect(state.data.observedParams).toEqual(updated.data.observedParams);
    expect(state.data.project).toEqual(updated.data.project);
  }
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

test("JSON読み込みレポートは両テーマで読め、開閉と削除の操作を保つ", async ({ editor, webMcp }) => {
  await editor.open();
  const imported = await webMcp.execute("import_editor", {
    payload: { params: { name: "Import report sample", shapeProfile: "custom-shell", stemEnabled: true, topVisibleCenterHeight: 9.5 } },
  });
  expect(imported.ok).toBe(true);
  await expect(editor.importReport.root).toBeVisible();
  await expect(editor.importReport.names).toHaveText(["params.stemEnabled", "params.topVisibleCenterHeight"]);
  await expect(editor.importReport.values).toHaveText(["true", "9.5"]);

  for (const theme of ["light", "dark"]) {
    await editor.setTheme(theme);
    const samples = await editor.importReport.readContrastSamples();
    expect(samples.length).toBe(8);
    for (const sample of samples) {
      expect(contrastRatio(sample.color, sample.background), `${theme}: ${sample.label}`).toBeGreaterThanOrEqual(4.5);
    }
    await editor.importReport.hoverDelete();
    const hovered = await editor.importReport.readContrastSamples();
    for (const sample of hovered) {
      expect(contrastRatio(sample.color, sample.background), `${theme}, hover: ${sample.label}`).toBeGreaterThanOrEqual(4.5);
    }
    await editor.importReport.toggleDetails();
    await expect(editor.importReport.list).toBeHidden();
    await editor.importReport.toggleDetails();
    await expect(editor.importReport.list).toBeVisible();
  }
  await editor.importReport.deleteParam();
  await expect(editor.importReport.names).toHaveText(["params.topVisibleCenterHeight"]);
  await editor.importReport.deleteParam();
  await expect(editor.importReport.root).toBeHidden();
});
