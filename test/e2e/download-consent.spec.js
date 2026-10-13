import { test, expect, readDownloadedJson } from "./fixtures.js";
import { contrastRatio } from "./support/color-contrast.js";

test("保存ごとに同意を求め、キャンセルとEscでダウンロードせず両テーマで読める", async ({ editor, webMcp, downloads }) => {
  await editor.open();
  expect((await webMcp.execute("update", { params: {
    name: "License sample", legendFontKey: "kurobara-cinderella-regular",
    topLegendRightTopEnabled: true, topLegendRightTopContentType: "icon", topLegendRightTopIconSet: "font-awesome",
  } })).ok).toBe(true);
  await editor.project.open();
  let dialog;
  for (const theme of ["light", "dark"]) {
    await editor.setTheme(theme);
    dialog = await editor.project.openExport("License sample");
    await dialog.requestJson();
    await expect(editor.consent.agreement).not.toBeChecked();
    await expect(editor.consent.agreement).toBeFocused();
    await expect(editor.consent.acceptButton).toBeDisabled();
    await editor.consent.trySubmitUnchecked();
    await expect(editor.consent.root).toBeVisible();
    expect(downloads).toHaveLength(0);
    expect((await editor.consent.tabFocusCycle()).every(Boolean)).toBe(true);
    await expect(editor.consent.filename).toHaveText("License sample.json");
    await expect(editor.consent.root).toContainText("黒薔薇シンデレラ");
    await expect(editor.consent.root).not.toContainText("M PLUS 1 Variable");
    await expect(editor.consent.root).toContainText("CC BY 4.0");
    await expect(editor.consent.attributions).toContainText(["Copyright(c) 2017 M+ FONTS PROJECT/MODI", "Font Awesome"]);
    const copyButton = await editor.consent.copyAttribution();
    await expect(copyButton).toHaveText("コピー済み");
    await editor.consent.setAgreement(true);
    await expect(editor.consent.acceptButton).toBeEnabled();
    for (const sample of await editor.consent.readColors()) {
      expect(contrastRatio(sample.color, sample.background), `${theme}: ${sample.label}`).toBeGreaterThanOrEqual(4.5);
    }
    await editor.consent.hoverAccept();
    for (const sample of await editor.consent.readColors()) {
      expect(contrastRatio(sample.color, sample.background), `${theme}, hover: ${sample.label}`).toBeGreaterThanOrEqual(4.5);
    }
    await editor.consent.capture(`.tmp/download-consent-${theme}.png`);
    await editor.consent.cancel({ escape: theme === "dark" });
    await expect(dialog.root).toBeVisible();
    await expect(dialog.status).toHaveText("ダウンロードをキャンセルしました。");
    await expect(dialog.jsonButton).toBeFocused();
    expect(downloads).toHaveLength(0);
    await dialog.close();
  }
  await editor.resize(390, 844);
  dialog = await editor.project.openExport("License sample");
  await dialog.requestJson();
  await expect(editor.consent.agreement).not.toBeChecked();
  const layout = await editor.consent.readLayout();
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.top).toBeGreaterThanOrEqual(0);
  expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight);
  await editor.consent.capture(".tmp/download-consent-mobile.png");
  await editor.consent.cancel();
  const payload = await readDownloadedJson(await dialog.exportJson());
  expect(payload.params).toMatchObject({ name: "License sample", legendFontKey: "kurobara-cinderella-regular" });
  expect(downloads).toHaveLength(1);
});

test("WebMCPの全出力形式も画面の同意を待ち、拒否後に排他を解除する", async ({ editor, webMcp, downloads }) => {
  await editor.open();
  expect((await webMcp.execute("set_keyboard", { layout: [["A"]] })).ok).toBe(true);
  const before = (await webMcp.execute("get_state")).data;
  expect((await webMcp.execute("assign", { slotId: before.project.keyboard.keys[0].id, keycapId: before.project.activeKeycapId })).ok).toBe(true);
  for (const format of ["editor-data", "3mf", "step", "stl", "keyboard-3mf", "project-zip"]) {
    const result = webMcp.execute("export", { format });
    await editor.consent.waitForOpen();
    await expect(editor.consent.acceptButton).toBeDisabled();
    await expect(editor.consent.resources).toHaveCount(["step", "stl"].includes(format) ? 0 : 1);
    expect((await webMcp.execute("get_state")).data.export.consentPending).toBe(true);
    expect((await webMcp.execute("update", { params: { name: "Blocked" } })).error.code).toBe("busy");
    await editor.consent.cancel();
    expect(await result).toMatchObject({ ok: false, contractVersion: 3, error: { code: "consent_declined" } });
    expect((await webMcp.execute("get_state")).data.export.consentPending).toBe(false);
    expect(downloads).toHaveLength(0);
  }
  expect((await webMcp.execute("update", { params: { name: "After consent" } })).ok).toBe(true);
});

test("WebMCPの同意待機中のAbortSignalで画面を閉じ、保存せず再実行できる", async ({ editor, webMcp, downloads }) => {
  await editor.open();
  for (const format of ["editor-data", "project-zip"]) {
    await webMcp.startAbortableExport(format);
    await editor.consent.waitForOpen();
    expect(await webMcp.abortExport()).toEqual({ aborted: true, name: "AbortError" });
    await expect(editor.consent.root).toBeHidden();
    expect(downloads).toHaveLength(0);
    expect((await webMcp.execute("update", { params: { name: "Retry" } })).ok).toBe(true);
  }
  const exported = await webMcp.executeWithDownload("export", { format: "editor-data" });
  expect(exported.result.ok).toBe(true);
  expect((await readDownloadedJson(exported.download)).params.name).toBe("Retry");
});

test("ZIPは全キーの設定を集約し、配置3MFは割り当てたキーだけを確認する", async ({ editor, webMcp, downloads }) => {
  await editor.open();
  expect((await webMcp.execute("set_keyboard", { layout: [["A"]] })).ok).toBe(true);
  const before = (await webMcp.execute("get_state")).data;
  const batch = await webMcp.execute("batch", { keycaps: [{ ref: "rose", params: { name: "Rose", legendFontKey: "kurobara-cinderella-regular" } }],
    assignments: [{ slotId: before.project.keyboard.keys[0].id, keycapRef: "rose" }] });
  expect(batch.ok).toBe(true);
  expect((await webMcp.execute("import_editor", { payload: { params: { name: "My font", legendFontKey: "user-font:not-loaded" } } })).ok).toBe(true);
  const zip = webMcp.execute("export", { format: "project-zip" });
  await editor.consent.waitForOpen();
  await expect(editor.consent.root).toContainText("黒薔薇シンデレラ");
  await expect(editor.consent.root).toContainText("ライセンス情報を取得できません");
  await editor.consent.cancel();
  expect((await zip).error.code).toBe("consent_declined");
  const keyboard = webMcp.execute("export", { format: "keyboard-3mf" });
  await editor.consent.waitForOpen();
  await expect(editor.consent.root).toContainText("黒薔薇シンデレラ");
  await expect(editor.consent.root).not.toContainText("ライセンス情報を取得できません");
  await editor.consent.cancel();
  expect((await keyboard).error.code).toBe("consent_declined");
  expect(downloads).toHaveLength(0);
});

test("フォント変更後は使用中の印字だけを表示し、無効・空の周辺印字を除外する", async ({ editor, webMcp }) => {
  await editor.open();
  expect((await webMcp.execute("update", { params: { name: "Rose only", legendFontKey: "kurobara-cinderella-regular" } })).ok).toBe(true);
  await editor.project.open();
  const dialog = await editor.project.openExport("Rose only");
  await dialog.requestJson();
  await expect(editor.consent.resources).toHaveCount(1);
  await expect(editor.consent.resources).toContainText(["黒薔薇シンデレラ"]);
  await expect(editor.consent.root).not.toContainText("M PLUS 1 Variable");
  await editor.consent.cancel();
  await dialog.close();

  for (const params of [
    { topLegendRightTopEnabled: true, topLegendRightTopText: "2" },
    { topLegendRightTopText: "   " },
    { topLegendRightTopEnabled: false, sideLegendFrontEnabled: true, sideLegendFrontText: "Side" },
    { sideLegendFrontEnabled: false, legendEnabled: false },
  ]) {
    expect((await webMcp.execute("update", { params })).ok).toBe(true);
    const pending = webMcp.execute("export", { format: "project-zip" });
    await editor.consent.waitForOpen();
    const count = params.topLegendRightTopEnabled || params.sideLegendFrontEnabled ? 2 : params.legendEnabled === false ? 0 : 1;
    await expect(editor.consent.resources).toHaveCount(count);
    if (count === 1) await expect(editor.consent.root).not.toContainText("M PLUS 1 Variable");
    if (count === 0) await expect(editor.consent.root).toContainText("この出力に使用するフォント・アイコンはありません。");
    await editor.consent.cancel();
    expect((await pending).error.code).toBe("consent_declined");
  }
});
