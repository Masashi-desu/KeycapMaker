import { test, expect } from "./fixtures.js";
import { contrastRatio } from "./support/color-contrast.js";

test("テーマの切り替えは入力欄の配色を変え、キーキャップの製造色を保持する", async ({ editor, webMcp }) => {
  await editor.open();
  const updated = await webMcp.execute("update", { params: { bodyColor: "#245a81", legendColor: "#f0d48d", homingBarColor: "#bf5044" } });
  expect(updated.ok).toBe(true);
  await editor.openKeytop();
  let lightColors;
  for (const theme of ["light", "dark"]) {
    await editor.setTheme(theme);
    await expect(editor.nameCardIcon).toBeVisible();
    await expect(editor.nameCardIcon).toHaveCSS("mask-image", /keycap-ui\/icons\/name\.svg/);
    await expect(editor.fieldIcon("keyUnitMm")).toHaveCSS("mask-image", /keycap-ui\/icons\/key-unit-basis\.svg/);
    await expect(editor.fieldIcon("keyWidth")).toHaveCSS("mask-image", /keycap-ui\/icons\/key-width\.svg/);
    await expect(editor.fieldIcon("topCornerRadius")).toHaveCSS("mask-image", /keycap-ui\/icons\/surface-radius\.svg/);
    await expect(editor.fieldIcon("topPitchDeg")).toHaveCSS("mask-image", /keycap-ui\/icons\/slope-pitch\.svg/);
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

test("印字位置を切り替えると選んだ設定だけを表示し、他の位置の印字も保持する", async ({ editor, webMcp }) => {
  await editor.resize(483, 505);
  await editor.open();
  await editor.openLegends();
  await expect(editor.legendPosition("中央の印字")).toBeChecked();
  await editor.editLegendText("legendText", "Home");
  const before = await webMcp.execute("get_state");
  const positions = [
    ["左上の印字", "topLegendLeftTop"], ["右上の印字", "topLegendRightTop"],
    ["左下の印字", "topLegendLeftBottom"], ["右下の印字", "topLegendRightBottom"],
    ["前面サイドウォール", "sideLegendFront"], ["背面サイドウォール", "sideLegendBack"],
    ["左側サイドウォール", "sideLegendLeft"], ["右側サイドウォール", "sideLegendRight"],
  ];
  for (const [label, prefix] of positions) {
    await editor.selectLegendPosition(label);
    await expect(editor.legendPosition(label)).toBeChecked();
    await expect(editor.legendFields).toHaveAccessibleName(label);
    await expect(editor.legendField(`${prefix}Enabled`)).toBeVisible();
    await expect(editor.legendField("legendEnabled")).toHaveCount(0);
  }
  const selected = await webMcp.execute("get_state");
  expect(selected.data.observedParams).toEqual(before.data.observedParams);
  expect(selected.data.project).toEqual(before.data.project);

  await editor.selectLegendPosition("前面サイドウォール");
  await editor.enableLegend("sideLegendFrontEnabled");
  await editor.editLegendText("sideLegendFrontText", "Fn");
  await editor.selectLegendPosition("中央の印字");
  await expect(editor.legendField("legendText")).toHaveValue("Home");
  await editor.nextLegendPosition("中央の印字");
  await expect(editor.legendPosition("左上の印字")).toBeFocused();
  await expect(editor.legendPosition("左上の印字")).toBeChecked();
  const updated = await webMcp.execute("update", { params: { topLegendLeftTopEnabled: true, topLegendLeftTopText: "1" } });
  expect(updated.data.observedParams).toMatchObject({ legendText: "Home", sideLegendFrontText: "Fn" });
  await expect(editor.legendField("topLegendLeftTopText")).toHaveValue("1");
  await editor.selectLegendPosition("前面サイドウォール");
  await expect(editor.legendField("sideLegendFrontText")).toHaveValue("Fn");
});

test("横幅をドラッグしている間もフレームごとにmmとuが追従する", async ({ editor, frameClock }) => {
  await editor.open();
  await editor.preview.waitForStatus("ready");
  await frameClock.pause();
  const requestId = await editor.preview.requestId();
  const basis = Number(await editor.parameters.control("keyUnitMm").inputValue());
  const drag = await editor.parameters.startSliderDrag("keyWidth", 0.24);
  try {
    let previous = Number(await drag.slider.inputValue());
    for (const fraction of [0.35, 0.48, 0.62, 0.76]) {
      await drag.move(fraction);
      await frameClock.advance(16);
      const mm = Number(await drag.slider.inputValue());
      expect(mm).toBeGreaterThan(previous);
      expect(Number(await editor.width.inputValue())).toBe(mm);
      expect(await editor.widthUnits.inputValue()).toBe((mm / basis).toFixed(2));
      expect(await editor.preview.requestId()).toBe(requestId);
      previous = mm;
    }
  } finally {
    await drag.release();
  }
});

test("トップハットの高さが0を跨いでもスライダーがドラッグを受け続ける", async ({ editor, frameClock, webMcp }) => {
  await editor.open();
  const setup = await webMcp.execute("update", { params: { topHatEnabled: true, topHatSeparateColorEnabled: true } });
  expect(setup.ok).toBe(true);
  await editor.parameters.expand("topHat");
  await editor.preview.waitForStatus("ready");
  await frameClock.pause();
  const drag = await editor.parameters.startSliderDrag("topHatHeight", 0.02);
  try {
    for (const [fraction, raised] of [[0.03, false], [0.42, true], [0.05, false], [0.7, true]]) {
      await drag.move(fraction);
      await frameClock.advance(16);
      const height = Number(await drag.slider.inputValue());
      expect(height > 0).toBe(raised);
      expect(Number(await editor.parameters.control("topHatHeight").inputValue())).toBe(height);
      expect(await editor.parameters.control("topHatColor").isVisible()).toBe(raised);
    }
  } finally {
    await drag.release();
  }
});

test("前端の高さをドラッグすると同じフレームで後端の高さも変わる", async ({ editor, frameClock, webMcp }) => {
  await editor.open();
  const setup = await webMcp.execute("update", { params: { topSlopeInputMode: "edge-height", topOffsetY: 0 } });
  expect(setup.ok).toBe(true);
  const center = setup.data.observedParams.topCenterHeight;
  await editor.parameters.expand("top");
  await editor.preview.waitForStatus("ready");
  await frameClock.pause();
  const requestId = await editor.preview.requestId();
  const drag = await editor.parameters.startSliderDrag("topFrontHeight", 0.4);
  try {
    let previous = Number(await drag.slider.inputValue());
    for (const fraction of [0.47, 0.54, 0.44]) {
      await drag.move(fraction);
      await frameClock.advance(16);
      const front = Number(await drag.slider.inputValue());
      expect(front).not.toBe(previous);
      expect(Number(await editor.parameters.control("topFrontHeight").inputValue())).toBe(front);
      expect(Number(await editor.parameters.control("topBackHeight").inputValue())).toBeCloseTo(2 * center - front, 2);
      expect(await editor.preview.requestId()).toBe(requestId);
      previous = front;
    }
  } finally {
    await drag.release();
  }
});
